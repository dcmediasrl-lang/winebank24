export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Devi effettuare il login" }, { status: 401 });

  const { nftId } = await req.json();

  const nft = await db.nft.findUnique({
    where: { id: nftId },
    include: { cantina: true, owner: true },
  });

  if (!nft || !nft.isListed || !nft.price) {
    return NextResponse.json({ error: "NFT non disponibile" }, { status: 400 });
  }

  if (nft.ownerId === session.user.id) {
    return NextResponse.json({ error: "Non puoi acquistare il tuo stesso NFT" }, { status: 400 });
  }

  const config = await db.platformConfig.findFirst();
  const platformFeePct = config?.platformFeePct ?? 2.5;

  const checkoutSession = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(nft.price * 100),
          product_data: {
            name: nft.name,
            description: `${nft.cantina.name} — NFT Bottiglia #${nft.bottleNumber}`,
            images: nft.imageUrl ? [nft.imageUrl] : [],
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      nftId: nft.id,
      buyerId: session.user.id,
      sellerId: nft.ownerId,
      platformFeePct: platformFeePct.toString(),
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
