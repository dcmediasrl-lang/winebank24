export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (id === session.user.id) {
    return NextResponse.json({ error: "Non puoi eliminare il tuo account" }, { status: 400 });
  }

  try {
    // Delete dependent records that don't cascade automatically
    await db.offer.deleteMany({ where: { OR: [{ buyerId: id }, { sellerId: id }] } });
    await db.nftFraction.deleteMany({ where: { ownerId: id } });
    await db.nft.deleteMany({ where: { ownerId: id } });
    // User delete cascades: Account, Session, BuyerContract, ActivityLog, etc.
    await db.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin] delete user", err);
    return NextResponse.json({ error: "Errore durante l'eliminazione" }, { status: 500 });
  }
}
