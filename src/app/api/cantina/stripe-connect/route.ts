export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

// POST — create (or resume) Stripe Connect onboarding for this cantina
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const cantina = await db.cantina.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, stripeAccountId: true },
  });
  if (!cantina) return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });

  const { lang } = await req.json().catch(() => ({ lang: "it" }));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const returnUrl  = `${appUrl}/${lang}/cantina/impostazioni?tab=pagamenti&stripe=success`;
  const refreshUrl = `${appUrl}/${lang}/cantina/impostazioni?tab=pagamenti&stripe=refresh`;

  try {
    const stripe = getStripe();
    let accountId = cantina.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "IT",
        // transfers-only richiede l'approvazione della piattaforma da parte
        // di Stripe: la coppia card_payments + transfers è la config standard
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: { name: cantina.name },
      });
      accountId = account.id;
      await db.cantina.update({
        where: { id: cantina.id },
        data: { stripeAccountId: accountId },
      });
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url });
  } catch (err) {
    console.error("[stripe-connect]", err);
    return NextResponse.json({ error: "Errore Stripe Connect" }, { status: 500 });
  }
}

// DELETE — disconnect (removes the local reference, not the Stripe account)
export async function DELETE() {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }
  const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
  if (!cantina) return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });

  await db.cantina.update({
    where: { id: cantina.id },
    data: { stripeAccountId: null },
  });
  return NextResponse.json({ success: true });
}
