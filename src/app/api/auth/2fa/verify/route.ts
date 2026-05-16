export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verify } from "otplib";
import { logActivity } from "@/lib/activity";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { code } = await req.json();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true },
  });

  if (!user?.twoFactorSecret) {
    return NextResponse.json({ error: "2FA non configurato" }, { status: 400 });
  }

  const result = await verify({ token: code, secret: user.twoFactorSecret });
  if (!result?.valid) {
    return NextResponse.json({ error: "Codice non valido" }, { status: 400 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: true },
  });

  await logActivity(session.user.id, "2FA_ENABLED");

  return NextResponse.json({ success: true });
}
