export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  role: z.enum(["ADMIN", "CANTINA", "COLLECTOR"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;
  const body = schema.parse(await req.json());

  // Prevent removing own admin role
  if (id === session.user.id && body.role !== "ADMIN") {
    return NextResponse.json({ error: "Non puoi rimuovere il tuo stesso ruolo admin" }, { status: 400 });
  }

  await db.user.update({ where: { id }, data: { role: body.role } });
  return NextResponse.json({ success: true });
}
