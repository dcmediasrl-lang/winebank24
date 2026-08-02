export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

// Acquisto diretto di una quota in vendita: crea il checkout Stripe.
// Il trasferimento avviene solo nel webhook (executeFractionResaleTransfer).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { allowed } = await rateLimit(rateLimitKey(session.user.id, "checkout"), 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Troppi tentativi. Riprova tra un'ora." }, { status: 429 });
  }

  const { id } = await params;
  try {
    const fraction = await db.nftFraction.findUnique({
      where: { id },
      include: {
        nft: { include: { cantina: { select: { name: true, stripeAccountId: true } } } },
      },
    });

    if (!fraction) return NextResponse.json({ error: "Quota non trovata" }, { status: 404 });
    if (!fraction.isListed) return NextResponse.json({ error: "Questa quota non è in vendita" }, { status: 400 });
    if (fraction.ownerId === session.user.id) return NextResponse.json({ error: "Non puoi acquistare la tua stessa quota" }, { status: 400 });

    const askingPrice = Number(fraction.askingPrice ?? fraction.investedAmount);
    if (askingPrice <= 0) return NextResponse.json({ error: "Prezzo della quota non valido" }, { status: 400 });
    const listedPct = fraction.listedPercentage !== null
      ? Number(fraction.listedPercentage)
      : Number(fraction.percentage);

    const config = await db.platformConfig.findFirst();
    const platformFeePct = config?.platformFeePct ?? 7.0;
    const sellerFeePct = 3.0; // vendita tra collezionisti: sempre secondaria

    const amountCents = Math.round(askingPrice * 100);
    const buyerFeeCents = Math.round(amountCents * platformFeePct / 100);
    const sellerFeeCents = Math.round(amountCents * sellerFeePct / 100);
    const platformFeeCents = buyerFeeCents + sellerFeeCents;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const lang = req.headers.get("referer")?.match(/\/(it|en)\//)?.[1] ?? "it";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionParams: any = {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: `${fraction.nft.name} — quota ${listedPct.toFixed(2)}%`,
              description: `${fraction.nft.cantina.name} — Co-proprietà (vendita tra collezionisti)`,
              images: fraction.nft.imageUrl ? [fraction.nft.imageUrl] : [],
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
        type: "fraction_resale",
        fractionId: fraction.id,
        buyerId: session.user.id,
        platformFeeCents: platformFeeCents.toString(),
      },
      success_url: `${appUrl}/${lang}/collector/portfolio?purchase=success`,
      cancel_url: `${appUrl}/${lang}/marketplace`,
    };

    if (fraction.nft.cantina.stripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: fraction.nft.cantina.stripeAccountId },
      };
    }

    const checkoutSession = await getStripe().checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Errore nell'acquisto della quota" }, { status: 500 });
  }
}
