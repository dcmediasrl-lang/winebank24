export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { nftId, address, notes } = await req.json();
  if (!nftId || !address?.trim()) {
    return NextResponse.json({ error: "Indirizzo di consegna obbligatorio" }, { status: 400 });
  }

  const nft = await db.nft.findUnique({
    where: { id: nftId },
    include: { cantina: { select: { name: true, stripeAccountId: true } } },
  });

  if (!nft) return NextResponse.json({ error: "Certificato non trovato" }, { status: 404 });
  if (!nft.physicalDeliveryUnlocked) return NextResponse.json({ error: "La cantina non ha ancora abilitato il ritiro fisico" }, { status: 400 });
  if (nft.status === "BURN_REQUESTED" || nft.status === "BURNED") {
    return NextResponse.json({ error: "Ritiro già richiesto o completato" }, { status: 400 });
  }

  if (nft.isFractionable) {
    // Certificato in co-proprietà: il riscatto è possibile solo per chi
    // possiede il 100% delle quote, dopo aver liquidato gli altri collezionisti
    const fractions = await db.nftFraction.findMany({
      where: { nftId: nft.id },
      select: { ownerId: true },
    });
    if (fractions.length === 0) {
      return NextResponse.json({ error: "Nessuna quota emessa per questo certificato" }, { status: 400 });
    }
    if (fractions.some(f => f.ownerId !== session.user.id)) {
      return NextResponse.json(
        { error: "Per riscattare la bottiglia devi prima acquisire le quote degli altri collezionisti, facendo loro un'offerta di liquidazione" },
        { status: 400 }
      );
    }
    if (Number(nft.availableValue ?? 0) > 0) {
      return NextResponse.json(
        { error: "Alcune quote di questo certificato sono ancora disponibili presso la cantina: devi acquisirle prima di poter riscattare la bottiglia" },
        { status: 400 }
      );
    }
  } else if (nft.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Non sei il proprietario" }, { status: 403 });
  }

  const bottleValue = nft.price ?? Number(nft.totalValue ?? 0);
  if (bottleValue <= 0) {
    return NextResponse.json({ error: "Valore bottiglia non determinabile" }, { status: 400 });
  }

  // Fee di piattaforma 5% (copre le transazioni Stripe), pagata da chi riscatta
  const burnFee = bottleValue * 0.05;
  const vat = burnFee * 0.22;
  const shipping = nft.shippingCost ?? 0;

  const burnFeeCents = Math.round(burnFee * 100);
  const vatCents = Math.round(vat * 100);
  const shippingCents = Math.round(shipping * 100);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const lang = req.headers.get("referer")?.match(/\/(it|en)\//)?.[1] ?? "it";

  const sessionParams: Record<string, unknown> = {
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: burnFeeCents,
          product_data: {
            name: `Fee di ritiro — ${nft.name}`,
            description: `5% del valore della bottiglia (€ ${bottleValue.toFixed(2)})`,
          },
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: "eur",
          unit_amount: vatCents,
          product_data: {
            name: "IVA (22%) sulla fee di ritiro",
          },
        },
        quantity: 1,
      },
      ...(shippingCents > 0 ? [{
        price_data: {
          currency: "eur",
          unit_amount: shippingCents,
          product_data: {
            name: `Spedizione — ${nft.cantina.name}`,
          },
        },
        quantity: 1,
      }] : []),
    ],
    metadata: {
      type: "burn_fee",
      nftId: nft.id,
      buyerId: session.user.id,
      address: address.trim().slice(0, 490),
      notes: (notes ?? "").slice(0, 490),
      burnFeeCents: burnFeeCents.toString(),
      vatCents: vatCents.toString(),
      shippingCents: shippingCents.toString(),
    },
    success_url: `${appUrl}/${lang}/collector/portfolio?delivery=success`,
    cancel_url: `${appUrl}/${lang}/nft/${nft.id}`,
  };

  // Via Stripe Connect: la fee 5% resta alla piattaforma,
  // alla cantina vanno IVA e spedizione
  if (nft.cantina.stripeAccountId) {
    sessionParams.payment_intent_data = {
      transfer_data: { destination: nft.cantina.stripeAccountId },
      application_fee_amount: burnFeeCents,
    };
  }

  const stripeSession = await getStripe().checkout.sessions.create(
    sessionParams as Parameters<ReturnType<typeof getStripe>["checkout"]["sessions"]["create"]>[0]
  );

  return NextResponse.json({ checkoutUrl: stripeSession.url });
}
