export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendPurchaseEmail, sendSaleEmail } from "@/lib/email";
import type Stripe from "stripe";
import { executeOfferTransfer, executeFractionResaleTransfer } from "@/lib/offer-transfer";
import { notify } from "@/lib/notifications";

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

  // Idempotenza: Stripe può recapitare lo stesso evento più volte
  const alreadyProcessed = await db.transaction.findFirst({
    where: { stripeId: stripeSession.id },
    select: { id: true },
  });
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (meta.type === "nft") {
      await handleNftPurchase(stripeSession, meta);
    } else if (meta.type === "fraction") {
      await handleFractionPurchase(stripeSession, meta);
    } else if (meta.type === "mint_fee") {
      await handleMintFeePaid(stripeSession, meta);
    } else if (meta.type === "burn_fee") {
      await handleBurnFeePaid(stripeSession, meta);
    } else if (meta.type === "offer") {
      await executeOfferTransfer({
        offerId: meta.offerId,
        stripeId: stripeSession.id,
        platformFee: parseInt(meta.platformFeeCents || "0") / 100,
      });
    } else if (meta.type === "fraction_resale") {
      await executeFractionResaleTransfer({
        fractionId: meta.fractionId,
        buyerId: meta.buyerId,
        stripeId: stripeSession.id,
        platformFee: parseInt(meta.platformFeeCents || "0") / 100,
      });
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
  const { nftId, buyerId, sellerId, platformFeePct, cantinaRoyaltyPct, isPrimarySale } = meta;

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

  // Doppia vendita: se il proprietario è cambiato dopo la creazione del
  // checkout, questo pagamento va rimborsato manualmente — non trasferire
  if (nft.ownerId !== sellerId) {
    console.error(
      `[webhook/stripe] DOPPIA VENDITA: NFT ${nftId} pagato da ${buyerId} ma il proprietario non è più ${sellerId}. Rimborsare la sessione ${stripeSession.id}`
    );
    return;
  }

  const price = nft.price;
  const isSecondary = isPrimarySale === "false";
  const sellerFee = parseInt(meta.sellerFeeCents || "0") / 100;
  // platformFee = commissione acquirente + fee venditore 3% (secondario)
  const platformFee = price * (parseFloat(platformFeePct) / 100) + sellerFee;

  // cantinaFee = royalty on secondary sales (seller is a collector, not the cantina)
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

  // Notifiche in-app (rispettano le preferenze utente)
  await Promise.allSettled([
    notify({ userId: buyerId, type: "NFT_PURCHASED", title: "Acquisto completato", body: `Hai acquistato "${nft.name}"`, link: "/collector/collezione" }),
    notify({ userId: sellerId, type: "NFT_SOLD", title: "Hai venduto un certificato", body: `"${nft.name}" venduto per € ${(price - sellerFee).toFixed(2)}`, link: "/collector/reports" }),
  ]);

  // Send email notifications
  await Promise.allSettled([
    sendPurchaseEmail(buyer.email, nft.name, price),
    sendSaleEmail(nft.owner.email, nft.name, price - sellerFee),
    // Notify cantina of royalty on secondary sales
    isSecondary && cantinaFee > 0
      ? sendSaleEmail(nft.cantina.user.email, `${nft.name} (royalty)`, cantinaFee)
      : Promise.resolve(),
  ]);
}

// ─── Mint fee ─────────────────────────────────────────────────────────────────
async function handleMintFeePaid(
  stripeSession: Stripe.Checkout.Session,
  meta: Record<string, string>
) {
  const { nftId, mintFeeCents, bottleValue } = meta;

  const nft = await db.nft.findUnique({ where: { id: nftId } });
  if (!nft || nft.status !== "PENDING_PAYMENT") return;

  const hasPrice = meta.hasPrice === "true";
  const isFractionable = meta.isFractionable === "true";
  const newStatus = (hasPrice || isFractionable) ? "LISTED" : "MINTED";

  await db.$transaction([
    db.nft.update({
      where: { id: nftId },
      data: {
        mintFeePaid: true,
        status: newStatus,
        isListed: hasPrice || isFractionable,
      },
    }),
    db.transaction.create({
      data: {
        nftId,
        sellerId: nft.ownerId,
        type: "MINT",
        amount: parseFloat(bottleValue),
        platformFee: parseInt(mintFeeCents) / 100,
        paymentMethod: "FIAT",
        stripeId: stripeSession.id,
      },
    }),
  ]);

  await notify({
    userId: nft.ownerId,
    type: "NFT_MINTED",
    title: "Certificato attivato",
    body: `"${nft.name}" è ora ${newStatus === "LISTED" ? "pubblicato nel marketplace" : "attivo nella tua collezione"}.`,
    link: "/cantina/nfts",
  });
}

// ─── Burn fee (ritiro bottiglia fisica) ──────────────────────────────────────
async function handleBurnFeePaid(
  stripeSession: Stripe.Checkout.Session,
  meta: Record<string, string>
) {
  const { nftId, buyerId, address, notes, burnFeeCents, vatCents, shippingCents } = meta;

  const nft = await db.nft.findUnique({
    where: { id: nftId },
    include: { cantina: { select: { userId: true } } },
  });
  if (!nft || nft.status === "BURN_REQUESTED" || nft.status === "BURNED") return;

  const totalPaid = (parseInt(burnFeeCents) + parseInt(vatCents) + parseInt(shippingCents)) / 100;
  // La fee 5% resta alla piattaforma; alla cantina vanno IVA e spedizione
  const platformShare = parseInt(burnFeeCents) / 100;

  await db.$transaction([
    db.nft.update({
      where: { id: nftId },
      data: { status: "BURN_REQUESTED", isListed: false },
    }),
    db.burnRequest.upsert({
      where: { nftId },
      create: {
        nftId,
        requestedBy: buyerId,
        address,
        notes: notes || null,
      },
      update: {
        address,
        notes: notes || null,
      },
    }),
    db.transaction.create({
      data: {
        nftId,
        buyerId,
        type: "BURN",
        amount: totalPaid,
        platformFee: platformShare,
        cantinaFee: totalPaid - platformShare,
        paymentMethod: "FIAT",
        stripeId: stripeSession.id,
      },
    }),
  ]);

  // La cantina deve preparare e spedire la bottiglia fisica
  await Promise.allSettled([
    notify({
      userId: nft.cantina.userId,
      type: "DELIVERY_REQUESTED",
      title: "Richiesta di ritiro bottiglia",
      body: `"${nft.name}" — il collezionista ha pagato e attende la spedizione.`,
      link: "/cantina/nfts",
    }),
    notify({
      userId: buyerId,
      type: "DELIVERY_REQUESTED",
      title: "Richiesta di ritiro registrata",
      body: `Pagamento ricevuto per "${nft.name}". La cantina preparerà la spedizione.`,
      link: "/collector/collezione",
    }),
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
    include: { cantina: { select: { userId: true, user: { select: { email: true } } } } },
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
    notify({
      userId: buyerId,
      type: "NFT_PURCHASED",
      title: "Quota acquistata",
      body: `${fractionPct.toFixed(2)}% di "${nft.name}" per € ${investedAmount.toFixed(2)}`,
      link: "/collector/collezione",
    }),
    notify({
      userId: nft.cantina.userId,
      type: "NFT_SOLD",
      title: "Quota di co-proprietà venduta",
      body: `${fractionPct.toFixed(2)}% di "${nft.name}"${newAvailable <= 0 ? " — quote esaurite" : ` — restano € ${newAvailable.toFixed(2)}`}`,
      link: "/cantina/nfts",
    }),
    sendPurchaseEmail(buyer.email, `${nft.name} — quota ${fractionPct.toFixed(2)}%`, investedAmount),
  ]);
}
