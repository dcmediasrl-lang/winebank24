export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { id } = await params;
  const { isListed, price } = await req.json();

  const nft = await db.nft.findUnique({ where: { id } });
  if (!nft || nft.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await db.nft.update({
    where: { id },
    data: { isListed, price, status: isListed ? "LISTED" : "MINTED" },
  });

  return NextResponse.json({ success: true });
}
