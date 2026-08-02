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
      cantina: { select: { id: true, name: true, stripeAccountId: true } },
      owner: { select: { id: true, email: true, name: true } },
    },
  });

  if (!nft || !nft.isListed || !nft.price || nft.status === "PENDING_PAYMENT") {
    return NextResponse.json({ error: "Certificato non disponibile" }, { status: 400 });
  }
  if (nft.ownerId === session.user.id) {
    return NextResponse.json({ error: "Non puoi acquistare il tuo stesso certificato" }, { status: 400 });
  }

  const config = await db.platformConfig.findFirst();
  const platformFeePct = config?.platformFeePct ?? 7.0;
  const cantinaRoyaltyPct = nft.royaltyPct; // per-bottle royalty set at mint time

  // Check primary vs secondary sale
  const cantinaOwner = await db.cantina.findUnique({
    where: { id: nft.cantinaId },
    select: { userId: true },
  });
  const isPrimarySale = nft.ownerId === cantinaOwner?.userId;

  // ── Fee calculation ────────────────────────────────────────────────────────
  // Le commissioni acquirente sono AGGIUNTE al prezzo di listino.
  // Primaria:   acquirente paga  prezzo + commissione piattaforma
  // Secondaria: acquirente paga  prezzo + commissione + royalty cantina;
  //             il venditore privato riceve prezzo − fee venditore 3%
  // ──────────────────────────────────────────────────────────────────────────
  const sellerFeePct = 3.0; // fee lato venditore sulle vendite secondarie
  const baseCents       = Math.round(nft.price * 100);
  const platformFeeCents = Math.round(nft.price * platformFeePct / 100 * 100);
  const royaltyCents     = isPrimarySale
    ? 0
    : Math.round(nft.price * cantinaRoyaltyPct / 100 * 100);
  const sellerFeeCents   = isPrimarySale
    ? 0
    : Math.round(nft.price * sellerFeePct / 100 * 100);
  const totalBuyerCents  = baseCents + platformFeeCents + royaltyCents;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const lang = req.headers.get("referer")?.match(/\/(it|en)\//)?.[1] ?? "it";

  // ── Stripe line items — buyer sees full breakdown ──────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems: any[] = [
    {
      price_data: {
        currency: "eur",
        unit_amount: baseCents,
        product_data: {
          name: nft.name,
          description: `${nft.cantina.name} — Certificato Bottiglia #${nft.bottleNumber}`,
          images: nft.imageUrl ? [nft.imageUrl] : [],
        },
      },
      quantity: 1,
    },
    {
      price_data: {
        currency: "eur",
        unit_amount: platformFeeCents,
        product_data: {
          name: `Commissione Wine Bank 24 (${platformFeePct}%)`,
          description: "Commissione di servizio a carico dell'acquirente",
        },
      },
      quantity: 1,
    },
  ];

  if (!isPrimarySale && royaltyCents > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        unit_amount: royaltyCents,
        product_data: {
          name: `Royalty cantina ${nft.cantina.name} (${cantinaRoyaltyPct}%)`,
          description: "Royalty sulla vendita secondaria a carico dell'acquirente",
        },
      },
      quantity: 1,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionParams: any = {
    mode: "payment",
    line_items: lineItems,
    metadata: {
      type: "nft",
      nftId: nft.id,
      buyerId: session.user.id,
      sellerId: nft.ownerId,
      cantinaId: nft.cantinaId,
      basePriceCents: baseCents.toString(),
      platformFeePct: platformFeePct.toString(),
      platformFeeCents: platformFeeCents.toString(),
      cantinaRoyaltyPct: cantinaRoyaltyPct.toString(),
      royaltyCents: royaltyCents.toString(),
      totalBuyerCents: totalBuyerCents.toString(),
      sellerFeeCents: sellerFeeCents.toString(),
      isPrimarySale: isPrimarySale ? "true" : "false",
    },
    success_url: `${appUrl}/${lang}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/${lang}/marketplace`,
  };

  // Stripe Connect split: platform takes its fee as application_fee.
  // The cantina royalty (secondary) is paid out separately by the platform.
  if (nft.cantina.stripeAccountId) {
    sessionParams.payment_intent_data = {
      // La piattaforma trattiene commissione acquirente + fee venditore (secondario)
      application_fee_amount: platformFeeCents + sellerFeeCents,
      transfer_data: { destination: nft.cantina.stripeAccountId },
    };
  }

  const checkoutSession = await getStripe().checkout.sessions.create(sessionParams);

  await logActivity(
    session.user.id,
    "NFT_PURCHASED",
    `CHECKOUT_STARTED NFT: ${nft.id} base:€${nft.price} fee:€${(platformFeeCents / 100).toFixed(2)} total:€${(totalBuyerCents / 100).toFixed(2)} IP:${ip}`,
  );

  return NextResponse.json({ url: checkoutSession.url });
}
