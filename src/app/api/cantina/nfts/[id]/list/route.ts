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

  const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
  const nft = await db.nft.findUnique({ where: { id } });

  if (!nft || !cantina || nft.cantinaId !== cantina.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await db.nft.update({
    where: { id },
    data: {
      isListed,
      price: price ?? nft.price,
      status: isListed ? "LISTED" : "MINTED",
    },
  });

  return NextResponse.json({ success: true });
}
