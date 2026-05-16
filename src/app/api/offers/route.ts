export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createOfferSchema = z.object({
  nftId: z.string().optional(),
  fractionId: z.string().optional(),
  amount: z.number().positive(),
  message: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createOfferSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });

  const { nftId, fractionId, amount, message } = parsed.data;

  // Exactly one of nftId or fractionId must be provided
  if ((!nftId && !fractionId) || (nftId && fractionId)) {
    return NextResponse.json({ error: "Specifica nftId oppure fractionId, non entrambi" }, { status: 400 });
  }

  try {
    let sellerId: string;
    let listedPrice: number;

    if (nftId) {
      const nft = await db.nft.findUnique({
        where: { id: nftId, isListed: true },
        select: { ownerId: true, price: true, isFractionable: true, totalValue: true, availableValue: true },
      });
      if (!nft) return NextResponse.json({ error: "NFT non trovato o non in vendita" }, { status: 404 });
      sellerId = nft.ownerId;
      // For fractionable NFTs use totalValue; for whole NFTs use price
      listedPrice = nft.isFractionable
        ? Number(nft.totalValue ?? 0)
        : (nft.price ?? 0);
      // Extra check: fractionable NFT must still have available value
      if (nft.isFractionable && Number(nft.availableValue ?? 0) <= 0) {
        return NextResponse.json({ error: "Non ci sono più quote disponibili per questo NFT" }, { status: 400 });
      }
    } else {
      const fraction = await db.nftFraction.findUnique({
        where: { id: fractionId!, isListed: true },
        select: { ownerId: true, askingPrice: true },
      });
      if (!fraction) return NextResponse.json({ error: "Quota non trovata o non in vendita" }, { status: 404 });
      sellerId = fraction.ownerId;
      listedPrice = Number(fraction.askingPrice ?? 0);
    }

    // Validate buyer !== seller
    if (session.user.id === sellerId) {
      return NextResponse.json({ error: "Non puoi fare un'offerta sul tuo stesso articolo" }, { status: 400 });
    }

    // Validate minimum 20% of listed price
    const minOffer = listedPrice * 0.20;
    if (amount < minOffer) {
      return NextResponse.json({
        error: `L'offerta minima è € ${minOffer.toFixed(2)} (20% del prezzo richiesto di € ${listedPrice.toFixed(2)})`,
      }, { status: 400 });
    }

    // Check no existing PENDING offer from same buyer on same item
    const existingOffer = await db.offer.findFirst({
      where: {
        buyerId: session.user.id,
        status: "PENDING",
        ...(nftId ? { nftId } : { fractionId }),
      },
    });
    if (existingOffer) {
      return NextResponse.json({ error: "Hai già un'offerta attiva su questo articolo" }, { status: 400 });
    }

    const offer = await db.offer.create({
      data: {
        nftId: nftId ?? null,
        fractionId: fractionId ?? null,
        buyerId: session.user.id,
        sellerId,
        amount,
        message: message ?? null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ offer });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Errore nella creazione dell'offerta" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  try {
    const [received, sent] = await Promise.all([
      db.offer.findMany({
        where: { sellerId: session.user.id },
        include: {
          nft: { select: { id: true, name: true, price: true, isFractionable: true, totalValue: true, imageUrl: true } },
          fraction: { select: { id: true, askingPrice: true, nft: { select: { name: true } } } },
          buyer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.offer.findMany({
        where: { buyerId: session.user.id },
        include: {
          nft: { select: { id: true, name: true, price: true, isFractionable: true, totalValue: true, imageUrl: true } },
          fraction: { select: { id: true, askingPrice: true, nft: { select: { name: true } } } },
          seller: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ received, sent });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Errore nel recupero delle offerte" }, { status: 500 });
  }
}
