export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
    if (!cantina) return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });

    const nft = await db.nft.findUnique({
      where: { id },
      include: {
        fractions: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!nft || nft.cantinaId !== cantina.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    if (!nft.isFractionable) {
      return NextResponse.json({ error: "Questo NFT non è frazionabile" }, { status: 400 });
    }

    if (nft.status === "LIQUIDATION_REQUESTED" || nft.status === "LIQUIDATED") {
      return NextResponse.json({ error: "Liquidazione già avviata o completata" }, { status: 400 });
    }

    await db.nft.update({
      where: { id },
      data: { status: "LIQUIDATION_REQUESTED" },
    });

    const holders = nft.fractions.map((f) => ({
      fractionId: f.id,
      owner: f.owner,
      percentage: Number(f.percentage),
      investedAmount: Number(f.investedAmount),
    }));

    return NextResponse.json({ success: true, holders });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Errore nella richiesta di liquidazione" }, { status: 500 });
  }
}
