export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { id } = await params;
  try {
    const fraction = await db.nftFraction.findUnique({
      where: { id },
      include: { nft: true },
    });

    if (!fraction) return NextResponse.json({ error: "Quota non trovata" }, { status: 404 });
    if (!fraction.isListed) return NextResponse.json({ error: "Questa quota non è in vendita" }, { status: 400 });
    if (fraction.ownerId === session.user.id) return NextResponse.json({ error: "Non puoi acquistare la tua stessa quota" }, { status: 400 });

    const askingPrice = Number(fraction.askingPrice ?? fraction.investedAmount);
    const totalPct = Number(fraction.percentage);
    const listedPct = fraction.listedPercentage !== null
      ? Number(fraction.listedPercentage)
      : totalPct; // entire fraction

    const isPartialSale = listedPct < totalPct;

    // Proportional invested amount for the listed portion
    const soldInvestedAmount = isPartialSale
      ? Number(fraction.investedAmount) * (listedPct / totalPct)
      : Number(fraction.investedAmount);

    const remainingPct = totalPct - listedPct;
    const remainingInvestedAmount = Number(fraction.investedAmount) - soldInvestedAmount;

    await db.$transaction(async (tx) => {
      if (isPartialSale) {
        // Reduce seller's fraction
        await tx.nftFraction.update({
          where: { id },
          data: {
            percentage: remainingPct,
            investedAmount: remainingInvestedAmount,
            isListed: false,
            askingPrice: null,
            listedPercentage: null,
          },
        });
      } else {
        // Transfer entire fraction to buyer
        await tx.nftFraction.update({
          where: { id },
          data: {
            ownerId: session.user.id,
            investedAmount: askingPrice,
            isListed: false,
            askingPrice: null,
            listedPercentage: null,
          },
        });
      }

      // Create buyer's fraction (only for partial sales — full transfer handled above)
      if (isPartialSale) {
        // Check if buyer already owns a fraction of the same NFT — merge if so
        const existingBuyerFraction = await tx.nftFraction.findFirst({
          where: { nftId: fraction.nftId, ownerId: session.user.id },
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
              ownerId: session.user.id,
              percentage: listedPct,
              investedAmount: askingPrice,
              isListed: false,
            },
          });
        }
      }

      // Transaction record
      await tx.transaction.create({
        data: {
          nftId: fraction.nftId,
          buyerId: session.user.id,
          sellerId: fraction.ownerId,
          type: "BUY",
          amount: askingPrice,
          paymentMethod: "FIAT",
        },
      });
    });

    return NextResponse.json({ success: true, partial: isPartialSale, listedPct, soldInvestedAmount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Errore nell'acquisto della quota" }, { status: 500 });
  }
}
