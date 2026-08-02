export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { rateLimit, rateLimitKey, getClientIp } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const schema = z.object({
  nftId: z.string(),
  amount: z.number().positive().max(1_000_000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Devi effettuare il login" }, { status: 401 });

  const { allowed } = await rateLimit(rateLimitKey(session.user.id, "checkout"), 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Troppi tentativi. Riprova tra un'ora." }, { status: 429 });
  }

  const ip = getClientIp(req);

  try {
    const body = schema.parse(await req.json());

    const nft = await db.nft.findUnique({
      where: { id: body.nftId },
      include: {
        cantina: { select: { id: true, name: true, stripeAccountId: true, royaltyPct: true } },
      },
    });

    if (!nft || !nft.isFractionable || nft.status !== "LISTED") {
      return NextResponse.json({ error: "NFT non disponibile" }, { status: 400 });
    }

    const available = Number(nft.availableValue);
    if (body.amount > available) {
      return NextResponse.json({
        error: `Importo troppo alto. Disponibile: €${available.toFixed(2)}`,
      }, { status: 400 });
    }

    const config = await db.platformConfig.findFirst();
    const platformFeePct = config?.platformFeePct ?? 7.0;

    const amountCents = Math.round(body.amount * 100);
    const platformFeeCents = Math.round(amountCents * platformFeePct / 100);
    const totalValue = Number(nft.totalValue);
    const percentage = (body.amount / totalValue) * 100;

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
              name: `${nft.name} — quota ${percentage.toFixed(2)}%`,
              description: `${nft.cantina.name} — Co-proprietà NFT`,
              images: nft.imageUrl ? [nft.imageUrl] : [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "fraction",
        nftId: nft.id,
        buyerId: session.user.id,
        cantinaId: nft.cantinaId,
        amount: body.amount.toString(),
        percentage: percentage.toString(),
        platformFeePct: platformFeePct.toString(),
      },
      success_url: `${appUrl}/${lang}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${lang}/marketplace`,
    };

    // Stripe Connect split when cantina has account
    if (nft.cantina.stripeAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: nft.cantina.stripeAccountId },
      };
    }

    const checkoutSession = await getStripe().checkout.sessions.create(sessionParams);

    await logActivity(session.user.id, "FRACTION_PURCHASED", `CHECKOUT_STARTED NFT: ${nft.id}, amount: ${body.amount}, IP: ${ip}`);
    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    console.error("[checkout/fraction]", err);
    return NextResponse.json({ error: "Errore nel checkout" }, { status: 500 });
  }
}
