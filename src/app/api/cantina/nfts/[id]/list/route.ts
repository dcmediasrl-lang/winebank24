export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;
  const { isListed, price } = await req.json();

  if (isListed && price !== undefined && (typeof price !== "number" || !isFinite(price) || price <= 0)) {
    return NextResponse.json({ error: "Inserisci un prezzo valido maggiore di zero" }, { status: 400 });
  }

  const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
  const nft = await db.nft.findUnique({ where: { id } });

  // La cantina può gestire solo gli NFT che possiede ancora: una volta
  // venduti a un collezionista, la vendita è decisa dal nuovo proprietario
  if (!nft || !cantina || nft.cantinaId !== cantina.id || nft.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }
  if (nft.status === "BURN_REQUESTED" || nft.status === "BURNED") {
    return NextResponse.json({ error: "Certificato non più disponibile" }, { status: 400 });
  }

  // Un bene frazionato ha un solo valore di riferimento (totalValue):
  // impostare anche un prezzo intero genererebbe due prezzi per lo stesso bene
  if (nft.isFractionable && isListed && price != null) {
    return NextResponse.json(
      { error: "Questo certificato è frazionato: il valore è definito dal valore totale, non da un prezzo di vendita." },
      { status: 400 }
    );
  }

  const finalPrice = price ?? nft.price;
  if (isListed && (finalPrice == null || finalPrice <= 0)) {
    return NextResponse.json({ error: "Inserisci un prezzo valido maggiore di zero" }, { status: 400 });
  }

  await db.nft.update({
    where: { id },
    data: {
      isListed,
      price: finalPrice,
      status: isListed ? "LISTED" : "MINTED",
    },
  });

  return NextResponse.json({ success: true });
}
