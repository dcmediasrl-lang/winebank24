export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendPurchaseEmail, sendSaleEmail } from "@/lib/email";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Webhook signature non valida" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const stripeSession = event.data.object as Stripe.Checkout.Session;
  const meta = stripeSession.metadata!;

  try {
    if (meta.type === "nft") {
      await handleNftPurchase(stripeSession, meta);
    } else if (meta.type === "fraction") {
      await handleFractionPurchase(stripeSession, meta);
    }
  } catch (err) {
    console.error("[webhook/stripe] Error processing event", event.type, err);
    // Return 200 to avoid Stripe retries for application errors
  }

  return NextResponse.json({ received: true });
}

// ─── NFT intero ──────────────────────────────────────────────────────────────
async function handleNftPurchase(
  stripeSession: Stripe.Checkout.Session,
  meta: Record<string, string>
) {
  const { nftId, buyerId, sellerId, cantinaId, platformFeePct, cantinaRoyaltyPct, isPrimarySale } = meta;

  const nft = await db.nft.findUnique({
    where: { id: nftId },
    include: {
      owner: { select: { email: true, name: true } },
      cantina: { select: { user: { select: { email: true, name: true } } } },
    },
  });
  if (!nft || !nft.price) return;

  const buyer = await db.user.findUnique({ where: { id: buyerId }, select: { email: true, name: true } });
  if (!buyer) return;

  const price = nft.price;
  const platformFee = price * (parseFloat(platformFeePct) / 100);

  // cantinaFee = royalty on secondary sales (seller is a collector, not the cantina)
  const isSecondary = isPrimarySale === "false";
  const cantinaFee = isSecondary ? price * (parseFloat(cantinaRoyaltyPct) / 100) : 0;

  await db.$transaction([
    // Transfer ownership
    db.nft.update({
      where: { id: nftId },
      data: { ownerId: buyerId, isListed: false, status: "SOLD" },
    }),
    // Record transaction with full split detail
    db.transaction.create({
      data: {
        nftId,
        buyerId,
        sellerId,
        type: "BUY",
        amount: price,
        platformFee,
        cantinaFee,
        paymentMethod: "FIAT",
        stripeId: stripeSession.id,
      },
    }),
  ]);

  // Send email notifications
  await Promise.allSettled([
    sendPurchaseEmail(buyer.email, nft.name, price),
    sendSaleEmail(nft.owner.email, nft.name, price - platformFee - cantinaFee),
    // Notify cantina of royalty on secondary sales
    isSecondary && cantinaFee > 0
      ? sendSaleEmail(nft.cantina.user.email, `${nft.name} (royalty)`, cantinaFee)
      : Promise.resolve(),
  ]);
}

// ─── Quota di co-proprietà ───────────────────────────────────────────────────
async function handleFractionPurchase(
  stripeSession: Stripe.Checkout.Session,
  meta: Record<string, string>
) {
  const { nftId, buyerId, amount, percentage, platformFeePct } = meta;

  const investedAmount = parseFloat(amount);
  const fractionPct = parseFloat(percentage);
  const platformFee = investedAmount * (parseFloat(platformFeePct) / 100);

  const nft = await db.nft.findUnique({
    where: { id: nftId },
    include: { cantina: { select: { user: { select: { email: true } } } } },
  });
  if (!nft) return;

  const buyer = await db.user.findUnique({ where: { id: buyerId }, select: { email: true, name: true } });
  if (!buyer) return;

  const available = Number(nft.availableValue);
  const newAvailable = Math.max(0, available - investedAmount);

  await db.$transaction([
    db.nftFraction.create({
      data: {
        nftId,
        ownerId: buyerId,
        percentage: fractionPct,
        investedAmount,
      },
    }),
    db.nft.update({
      where: { id: nftId },
      data: {
        availableValue: newAvailable,
        status: newAvailable <= 0 ? "SOLD" : "LISTED",
      },
    }),
    db.transaction.create({
      data: {
        nftId,
        buyerId,
        sellerId: null,
        type: "BUY",
        amount: investedAmount,
        platformFee,
        cantinaFee: investedAmount - platformFee, // cantina gets the net amount
        paymentMethod: "FIAT",
        stripeId: stripeSession.id,
      },
    }),
  ]);

  await Promise.allSettled([
    sendPurchaseEmail(buyer.email, `${nft.name} — quota ${fractionPct.toFixed(2)}%`, investedAmount),
  ]);
}
