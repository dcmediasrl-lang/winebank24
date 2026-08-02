export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { id } = await params;
  const { isListed, price } = await req.json();

  if (isListed && (typeof price !== "number" || !isFinite(price) || price <= 0)) {
    return NextResponse.json({ error: "Inserisci un prezzo valido maggiore di zero" }, { status: 400 });
  }

  const nft = await db.nft.findUnique({
    where: { id },
    include: { cantina: { select: { userId: true } } },
  });
  if (!nft || nft.ownerId !== session.user.id) {
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

  // Alla rimozione dalla vendita: la produzione della cantina torna MINTED,
  // un NFT acquistato da un collezionista torna SOLD
  const unlistedStatus = nft.cantina.userId === session.user.id ? "MINTED" : "SOLD";

  await db.nft.update({
    where: { id },
    data: { isListed, price: isListed ? price : nft.price, status: isListed ? "LISTED" : unlistedStatus },
  });

  return NextResponse.json({ success: true });
}
