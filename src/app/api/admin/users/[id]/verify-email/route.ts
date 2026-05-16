export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;

  await db.user.update({
    where: { id },
    data: {
      emailVerified: new Date(),
      emailVerifyToken: null,
      emailVerifyExpiry: null,
    },
  });

  return NextResponse.json({ success: true });
}
