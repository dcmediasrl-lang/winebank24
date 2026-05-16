export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  action: z.enum(["accept", "reject", "withdraw"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Azione non valida" }, { status: 400 });

  const { action } = parsed.data;

  try {
    const offer = await db.offer.findUnique({
      where: { id },
      include: {
        nft: true,
        fraction: true,
      },
    });

    if (!offer) return NextResponse.json({ error: "Offerta non trovata" }, { status: 404 });

    if (action === "accept" || action === "reject") {
      if (offer.sellerId !== session.user.id) {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
      }
      if (offer.status !== "PENDING") {
        return NextResponse.json({ error: "L'offerta non è più in attesa" }, { status: 400 });
      }
    }

    if (action === "withdraw") {
      if (offer.buyerId !== session.user.id) {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
      }
      if (offer.status !== "PENDING") {
        return NextResponse.json({ error: "L'offerta non è più in attesa" }, { status: 400 });
      }
    }

    if (action === "reject") {
      await db.offer.update({ where: { id }, data: { status: "REJECTED" } });
      return NextResponse.json({ success: true });
    }

    if (action === "withdraw") {
      await db.offer.update({ where: { id }, data: { status: "WITHDRAWN" } });
      return NextResponse.json({ success: true });
    }

    // action === "accept"
    await db.$transaction(async (tx) => {
      if (offer.nftId && offer.nft) {
        const nft = offer.nft;

        if (nft.isFractionable) {
          // ── Fractionable NFT: create a fraction for the buyer ──────────────
          const totalValue = Number(nft.totalValue ?? 0);
          const availableValue = Number(nft.availableValue ?? 0);

          if (offer.amount > availableValue) {
            throw new Error("Valore non più disponibile per questo importo");
          }

          const pct = totalValue > 0 ? (offer.amount / totalValue) * 100 : 0;
          const newAvailable = availableValue - offer.amount;

          // Update available value on NFT
          await tx.nft.update({
            where: { id: nft.id },
            data: { availableValue: newAvailable },
          });

          // Merge with existing buyer fraction if present
          const existing = await tx.nftFraction.findFirst({
            where: { nftId: nft.id, ownerId: offer.buyerId },
          });
          if (existing) {
            await tx.nftFraction.update({
              where: { id: existing.id },
              data: {
                percentage: Number(existing.percentage) + pct,
                investedAmount: Number(existing.investedAmount) + offer.amount,
              },
            });
          } else {
            await tx.nftFraction.create({
              data: {
                nftId: nft.id,
                ownerId: offer.buyerId,
                percentage: pct,
                investedAmount: offer.amount,
              },
            });
          }

          await tx.transaction.create({
            data: {
              nftId: nft.id,
              buyerId: offer.buyerId,
              sellerId: offer.sellerId,
              type: "BUY",
              amount: offer.amount,
              paymentMethod: "FIAT",
            },
          });

          // For fractionable NFTs other offers can still be accepted — don't auto-reject
        } else {
          // ── Whole NFT: transfer ownership ──────────────────────────────────
          await tx.nft.update({
            where: { id: offer.nftId },
            data: {
              ownerId: offer.buyerId,
              isListed: false,
              status: "SOLD",
              price: null,
            },
          });

          await tx.transaction.create({
            data: {
              nftId: offer.nftId,
              buyerId: offer.buyerId,
              sellerId: offer.sellerId,
              type: "BUY",
              amount: offer.amount,
              paymentMethod: "FIAT",
            },
          });

          // Auto-reject all other pending offers for this NFT
          await tx.offer.updateMany({
            where: { nftId: offer.nftId, status: "PENDING", id: { not: id } },
            data: { status: "REJECTED" },
          });
        }
      } else if (offer.fractionId && offer.fraction) {
        const fraction = offer.fraction;
        const totalPct = Number(fraction.percentage);
        const listedPct = fraction.listedPercentage !== null
          ? Number(fraction.listedPercentage)
          : totalPct;
        const isPartialSale = listedPct < totalPct;
        const askingPrice = offer.amount; // buyer pays their offer amount
        const soldInvestedAmount = isPartialSale
          ? Number(fraction.investedAmount) * (listedPct / totalPct)
          : Number(fraction.investedAmount);
        const remainingPct = totalPct - listedPct;
        const remainingInvestedAmount = Number(fraction.investedAmount) - soldInvestedAmount;

        if (isPartialSale) {
          await tx.nftFraction.update({
            where: { id: offer.fractionId },
            data: {
              percentage: remainingPct,
              investedAmount: remainingInvestedAmount,
              isListed: false,
              askingPrice: null,
              listedPercentage: null,
            },
          });
        } else {
          await tx.nftFraction.update({
            where: { id: offer.fractionId },
            data: {
              ownerId: offer.buyerId,
              investedAmount: askingPrice,
              isListed: false,
              askingPrice: null,
              listedPercentage: null,
            },
          });
        }

        if (isPartialSale) {
          const existingBuyerFraction = await tx.nftFraction.findFirst({
            where: { nftId: fraction.nftId, ownerId: offer.buyerId },
          });

          if (existingBuyerFraction) {
            await tx.nftFraction.update({
              where: { id: existingBuyerFraction.id },
              data: {
                percentage: Number(existingBuyerFraction.percentage) + listedPct,
                investedAmount: Number(existingBuyerFraction.investedAmount) + askingPrice,
              },
            });
          } else {
            await tx.nftFraction.create({
              data: {
                nftId: fraction.nftId,
                ownerId: offer.buyerId,
                percentage: listedPct,
                investedAmount: askingPrice,
                isListed: false,
              },
            });
          }
        }

        await tx.transaction.create({
          data: {
            nftId: fraction.nftId,
            buyerId: offer.buyerId,
            sellerId: offer.sellerId,
            type: "BUY",
            amount: offer.amount,
            paymentMethod: "FIAT",
          },
        });

        // Auto-reject all other pending offers for this fraction
        await tx.offer.updateMany({
          where: {
            fractionId: offer.fractionId,
            status: "PENDING",
            id: { not: id },
          },
          data: { status: "REJECTED" },
        });
      }

      // Mark this offer as accepted
      await tx.offer.update({ where: { id }, data: { status: "ACCEPTED" } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Errore nell'elaborazione dell'offerta" }, { status: 500 });
  }
}
