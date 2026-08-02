export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { notify } from "@/lib/notifications";

const patchSchema = z.object({
  action: z.enum(["accept", "reject", "withdraw"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Azione non valida" }, { status: 400 });

  const { action } = parsed.data;

  try {
    const offer = await db.offer.findUnique({
      where: { id },
      include: {
        nft: true,
        fraction: true,
      },
    });

    if (!offer) return NextResponse.json({ error: "Offerta non trovata" }, { status: 404 });

    if (action === "accept" || action === "reject") {
      if (offer.sellerId !== session.user.id) {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
      }
      if (offer.status !== "PENDING") {
        return NextResponse.json({ error: "L'offerta non è più in attesa" }, { status: 400 });
      }
    }

    if (action === "withdraw") {
      if (offer.buyerId !== session.user.id) {
        return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
      }
      if (offer.status !== "PENDING") {
        return NextResponse.json({ error: "L'offerta non è più in attesa" }, { status: 400 });
      }
    }

    if (action === "reject") {
      await db.offer.update({ where: { id }, data: { status: "REJECTED" } });
      await notify({
        userId: offer.buyerId,
        type: "OFFER_REJECTED",
        title: "La tua offerta è stata rifiutata",
        body: `Offerta di € ${offer.amount.toFixed(2)}`,
        link: "/collector/offerte",
      });
      return NextResponse.json({ success: true });
    }

    if (action === "withdraw") {
      await db.offer.update({ where: { id }, data: { status: "WITHDRAWN" } });
      return NextResponse.json({ success: true });
    }

    // action === "accept" — la proprietà NON viene trasferita qui:
    // l'offerta passa in attesa di pagamento e l'acquirente riceve il checkout.
    // Il trasferimento avviene nel webhook Stripe (executeOfferTransfer).

    // Verifica preliminare che l'articolo sia ancora trasferibile
    if (offer.nftId && offer.nft) {
      if (offer.nft.isFractionable) {
        if (offer.amount > Number(offer.nft.availableValue ?? 0)) {
          return NextResponse.json({ error: "Valore non più disponibile per questo importo" }, { status: 400 });
        }
      } else if (offer.nft.ownerId !== offer.sellerId) {
        return NextResponse.json({ error: "Non possiedi più questo certificato" }, { status: 400 });
      }
    } else if (offer.fraction && offer.fraction.ownerId !== offer.sellerId) {
      return NextResponse.json({ error: "Non possiedi più questa quota" }, { status: 400 });
    }

    await db.offer.update({ where: { id }, data: { status: "ACCEPTED" } });

    await notify({
      userId: offer.buyerId,
      type: "OFFER_ACCEPTED",
      title: "La tua offerta è stata accettata!",
      body: `Completa il pagamento di € ${offer.amount.toFixed(2)} per ricevere la proprietà.`,
      link: "/collector/offerte",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Errore nell'elaborazione dell'offerta" }, { status: 500 });
  }
}
