export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;
  const { unlock, shippingCost } = await req.json();

  const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
  if (!cantina) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const nft = await db.nft.findUnique({ where: { id } });
  if (!nft || nft.cantinaId !== cantina.id) {
    return NextResponse.json({ error: "Certificato non trovato" }, { status: 404 });
  }

  if (unlock && (shippingCost === undefined || shippingCost < 0)) {
    return NextResponse.json({ error: "Inserisci un costo di spedizione valido" }, { status: 400 });
  }

  await db.nft.update({
    where: { id },
    data: {
      physicalDeliveryUnlocked: !!unlock,
      shippingCost: unlock ? shippingCost : null,
    },
  });

  return NextResponse.json({ success: true });
}
