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
  if (nft.ownerId !== session.user.id) return NextResponse.json({ error: "Non sei il proprietario" }, { status: 403 });
  if (!nft.physicalDeliveryUnlocked) return NextResponse.json({ error: "La cantina non ha ancora abilitato il ritiro fisico" }, { status: 400 });
  if (nft.status === "BURN_REQUESTED" || nft.status === "BURNED") {
    return NextResponse.json({ error: "Ritiro già richiesto o completato" }, { status: 400 });
  }

  const bottleValue = nft.price ?? Number(nft.totalValue ?? 0);
  if (bottleValue <= 0) {
    return NextResponse.json({ error: "Valore bottiglia non determinabile" }, { status: 400 });
  }

  const burnFee = bottleValue * 0.02;
  const vat = burnFee * 0.22;
  const shipping = nft.shippingCost ?? 0;

  const burnFeeCents = Math.round(burnFee * 100);
  const vatCents = Math.round(vat * 100);
  const shippingCents = Math.round(shipping * 100);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const sessionParams: Record<string, unknown> = {
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: burnFeeCents,
          product_data: {
            name: `Fee di ritiro — ${nft.name}`,
            description: `2% del valore della bottiglia (€ ${bottleValue.toFixed(2)})`,
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
    success_url: `${appUrl}/it/collector/portfolio?delivery=success`,
    cancel_url: `${appUrl}/it/nft/${nft.id}`,
  };

  // Transfer everything to the cantina via Stripe Connect
  if (nft.cantina.stripeAccountId) {
    sessionParams.payment_intent_data = {
      transfer_data: { destination: nft.cantina.stripeAccountId },
    };
  }

  const stripeSession = await getStripe().checkout.sessions.create(
    sessionParams as Parameters<ReturnType<typeof getStripe>["checkout"]["sessions"]["create"]>[0]
  );

  return NextResponse.json({ checkoutUrl: stripeSession.url });
}
