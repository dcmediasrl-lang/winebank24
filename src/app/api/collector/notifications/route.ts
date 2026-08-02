export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — lista notifiche dell'utente
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = notifications.filter(n => !n.read).length;
  return NextResponse.json({ notifications, unread });
}

// PATCH — marca come lette (tutte, o una singola con { id })
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));

  if (id) {
    await db.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true },
    });
  } else {
    await db.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
  }
  return NextResponse.json({ success: true });
}

// DELETE — elimina tutte le notifiche lette
export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  await db.notification.deleteMany({ where: { userId: session.user.id, read: true } });
  return NextResponse.json({ success: true });
}
