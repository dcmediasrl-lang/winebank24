export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { rateLimit, rateLimitKey, getClientIp } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Devi effettuare il login" }, { status: 401 });

  const { allowed } = await rateLimit(rateLimitKey(session.user.id, "checkout"), 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Troppi tentativi. Riprova tra un'ora." }, { status: 429 });
  }

  const ip = getClientIp(req);
  const { nftId } = await req.json();

  const nft = await db.nft.findUnique({
    where: { id: nftId },
    include: {
      cantina: { select: { id: true, name: true, stripeAccountId: true, royaltyPct: true } },
      owner: { select: { id: true, email: true, name: true } },
    },
  });

  if (!nft || !nft.isListed || !nft.price) {
    return NextResponse.json({ error: "NFT non disponibile" }, { status: 400 });
  }
  if (nft.ownerId === session.user.id) {
    return NextResponse.json({ error: "Non puoi acquistare il tuo stesso NFT" }, { status: 400 });
  }

  const config = await db.platformConfig.findFirst();
  const platformFeePct = config?.platformFeePct ?? 2.5;
  const cantinaRoyaltyPct = nft.cantina.royaltyPct;

  // Check if seller is the cantina itself (primary sale) or a collector (secondary sale)
  const isPrimarySale = nft.ownerId === (
    await db.cantina.findUnique({ where: { id: nft.cantinaId }, select: { userId: true } })
  )?.userId;

  const amountCents = Math.round(nft.price * 100);
  const platformFeeCents = Math.round(amountCents * platformFeePct / 100);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Build Stripe session params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionParams: any = {
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          product_data: {
            name: nft.name,
            description: `${nft.cantina.name} — Certificato NFT Bottiglia #${nft.bottleNumber}`,
            images: nft.imageUrl ? [nft.imageUrl] : [],
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "nft",
      nftId: nft.id,
      buyerId: session.user.id,
      sellerId: nft.ownerId,
      cantinaId: nft.cantinaId,
      platformFeePct: platformFeePct.toString(),
      cantinaRoyaltyPct: cantinaRoyaltyPct.toString(),
      isPrimarySale: isPrimarySale ? "true" : "false",
    },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/it/marketplace`,
  };

  // If cantina has a Stripe Connect account → automatic split via application fee
  if (nft.cantina.stripeAccountId) {
    sessionParams.payment_intent_data = {
      application_fee_amount: platformFeeCents,
      transfer_data: { destination: nft.cantina.stripeAccountId },
    };
  }

  const checkoutSession = await getStripe().checkout.sessions.create(sessionParams);

  await logActivity(session.user.id, "NFT_PURCHASED", `CHECKOUT_STARTED NFT: ${nft.id}, IP: ${ip}`);
  return NextResponse.json({ url: checkoutSession.url });
}
