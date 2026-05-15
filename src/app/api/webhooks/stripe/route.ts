export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook signature non valida" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Response<Stripe.Checkout.Session>;
    const { nftId, buyerId, sellerId, platformFeePct } = session.metadata!;

    const nft = await db.nft.findUnique({ where: { id: nftId } });
    if (!nft || !nft.price) return NextResponse.json({ received: true });

    const platformFee = nft.price * (parseFloat(platformFeePct) / 100);

    await db.$transaction([
      db.nft.update({
        where: { id: nftId },
        data: { ownerId: buyerId, isListed: false, status: "SOLD" },
      }),
      db.transaction.create({
        data: {
          nftId,
          buyerId,
          sellerId,
          type: "BUY",
          amount: nft.price,
          platformFee,
          paymentMethod: "FIAT",
          stripeId: session.id,
        },
      }),
    ]);
  }

  return NextResponse.json({ received: true });
}
