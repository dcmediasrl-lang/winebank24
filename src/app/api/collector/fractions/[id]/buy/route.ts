export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { id } = await params;
  try {
    const fraction = await db.nftFraction.findUnique({ where: { id }, include: { nft: true } });
    if (!fraction) return NextResponse.json({ error: "Quota non trovata" }, { status: 404 });
    if (!fraction.isListed) return NextResponse.json({ error: "Questa quota non è in vendita" }, { status: 400 });
    if (fraction.ownerId === session.user.id) return NextResponse.json({ error: "Non puoi acquistare la tua stessa quota" }, { status: 400 });

    const askingPrice = Number(fraction.askingPrice ?? fraction.investedAmount);

    await db.$transaction([
      db.nftFraction.update({
        where: { id },
        data: {
          ownerId: session.user.id,
          isListed: false,
          askingPrice: null,
        },
      }),
      db.transaction.create({
        data: {
          nftId: fraction.nftId,
          buyerId: session.user.id,
          sellerId: fraction.ownerId,
          type: "BUY",
          amount: askingPrice,
          paymentMethod: "FIAT",
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Errore nell'acquisto della quota" }, { status: 500 });
  }
}
