export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

function langFromReferer(req: Request): string {
  return req.headers.get("referer")?.match(/\/(it|en)\//)?.[1] ?? "it";
}

// L'acquirente paga un'offerta ACCETTATA dal venditore.
// Il trasferimento di proprietà avviene solo nel webhook dopo il pagamento.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { allowed } = await rateLimit(rateLimitKey(session.user.id, "checkout"), 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Troppi tentativi. Riprova tra un'ora." }, { status: 429 });
  }

  const { id } = await params;

  const offer = await db.offer.findUnique({
    where: { id },
    include: {
      nft: { include: { cantina: { select: { name: true, stripeAccountId: true } } } },
      fraction: {
        include: {
          nft: { include: { cantina: { select: { name: true, stripeAccountId: true } } } },
        },
      },
    },
  });

  if (!offer) return NextResponse.json({ error: "Offerta non trovata" }, { status: 404 });
  if (offer.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Non sei l'autore di questa offerta" }, { status: 403 });
  }
  if (offer.status !== "ACCEPTED") {
    return NextResponse.json({ error: "L'offerta non è in attesa di pagamento" }, { status: 400 });
  }

  // L'articolo deve essere ancora trasferibile
  const nft = offer.nft ?? offer.fraction?.nft;
  if (!nft) return NextResponse.json({ error: "Articolo non trovato" }, { status: 404 });
  if (offer.nft && !offer.nft.isFractionable && offer.nft.ownerId !== offer.sellerId) {
    return NextResponse.json({ error: "Il venditore non possiede più questo certificato" }, { status: 400 });
  }
  if (offer.nft?.isFractionable && offer.amount > Number(offer.nft.availableValue ?? 0)) {
    return NextResponse.json({ error: "Valore non più disponibile" }, { status: 400 });
  }
  if (offer.fraction && offer.fraction.ownerId !== offer.sellerId) {
    return NextResponse.json({ error: "Il venditore non possiede più questa quota" }, { status: 400 });
  }

  const config = await db.platformConfig.findFirst();
  const platformFeePct = config?.platformFeePct ?? 7.0;
  const sellerFeePct = 3.0; // fee lato venditore sulle vendite secondarie

  // Secondaria = il venditore non è la cantina produttrice
  const producer = await db.cantina.findUnique({
    where: { id: nft.cantinaId },
    select: { userId: true },
  });
  const isSecondary = offer.sellerId !== producer?.userId;

  const amountCents = Math.round(offer.amount * 100);
  const buyerFeeCents = Math.round(amountCents * platformFeePct / 100);
  const sellerFeeCents = isSecondary ? Math.round(amountCents * sellerFeePct / 100) : 0;
  // Quota totale trattenuta dalla piattaforma
  const platformFeeCents = buyerFeeCents + sellerFeeCents;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const lang = langFromReferer(req);
  const itemName = offer.fraction
    ? `${nft.name} — quota ${Number(offer.fraction.listedPercentage ?? offer.fraction.percentage).toFixed(2)}%`
    : nft.name;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionParams: any = {
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: amountCents,
          product_data: {
            name: `Offerta accettata — ${itemName}`,
            description: nft.cantina.name,
            images: nft.imageUrl ? [nft.imageUrl] : [],
          },
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: "eur",
          unit_amount: buyerFeeCents,
          product_data: {
            name: `Commissione Wine Bank 24 (${platformFeePct}%)`,
            description: "Commissione di servizio a carico dell'acquirente",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "offer",
      offerId: offer.id,
      buyerId: session.user.id,
      platformFeeCents: platformFeeCents.toString(),
    },
    success_url: `${appUrl}/${lang}/collector/offerte?paid=1`,
    cancel_url: `${appUrl}/${lang}/collector/offerte`,
  };

  if (nft.cantina.stripeAccountId) {
    sessionParams.payment_intent_data = {
      application_fee_amount: platformFeeCents,
      transfer_data: { destination: nft.cantina.stripeAccountId },
    };
  }

  const checkoutSession = await getStripe().checkout.sessions.create(sessionParams);
  return NextResponse.json({ url: checkoutSession.url });
}
