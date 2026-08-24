export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendCantinaInvite } from "@/lib/cantina-invite";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;

  const cantina = await db.cantina.findUnique({
    where: { id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!cantina) {
    return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });
  }

  await sendCantinaInvite({
    userId: cantina.userId,
    email: cantina.user.email,
    contactName: cantina.user.name ?? cantina.name,
    cantinaName: cantina.name,
  });

  return NextResponse.json({ success: true });
}
