export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  nftId: z.string(),
  amount: z.number().positive(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  try {
    const body = schema.parse(await req.json());

    const nft = await db.nft.findUnique({ where: { id: body.nftId } });
    if (!nft) return NextResponse.json({ error: "NFT non trovato" }, { status: 404 });
    if (!nft.isFractionable) return NextResponse.json({ error: "Questo NFT non è frazionabile" }, { status: 400 });
    if (nft.status !== "LISTED") return NextResponse.json({ error: "NFT non disponibile per l'acquisto" }, { status: 400 });

    const available = Number(nft.availableValue);
    if (available < body.amount) {
      return NextResponse.json({ error: `Importo disponibile insufficiente. Disponibile: €${available.toFixed(2)}` }, { status: 400 });
    }

    const totalValue = Number(nft.totalValue);
    const percentage = (body.amount / totalValue) * 100;
    const newAvailable = available - body.amount;

    const [fraction] = await db.$transaction([
      db.nftFraction.create({
        data: {
          nftId: body.nftId,
          ownerId: session.user.id,
          percentage,
          investedAmount: body.amount,
        },
      }),
      db.nft.update({
        where: { id: body.nftId },
        data: {
          availableValue: newAvailable,
          status: newAvailable <= 0 ? "SOLD" : "LISTED",
        },
      }),
      db.transaction.create({
        data: {
          nftId: body.nftId,
          buyerId: session.user.id,
          type: "BUY",
          amount: body.amount,
          paymentMethod: "FIAT",
        },
      }),
    ]);

    return NextResponse.json({ success: true, fractionId: fraction.id, percentage });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Errore nell'acquisto della quota" }, { status: 500 });
  }
}
