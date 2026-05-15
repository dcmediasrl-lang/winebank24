export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { nftId, address, notes } = await req.json();

  const nft = await db.nft.findUnique({ where: { id: nftId } });
  if (!nft || nft.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await db.burnRequest.create({
    data: { nftId, requestedBy: session.user.id, address, notes },
  });

  await db.nft.update({
    where: { id: nftId },
    data: { status: "BURN_REQUESTED", isListed: false },
  });

  return NextResponse.json({ success: true });
}
