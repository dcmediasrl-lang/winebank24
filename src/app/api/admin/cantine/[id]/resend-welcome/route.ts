export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";
import { sendCantinaAccountSetupEmail } from "@/lib/email";

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

  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  await db.user.update({
    where: { id: cantina.userId },
    data: { emailVerifyToken: token, emailVerifyExpiry: expiry },
  });

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.winebank24.eu";
  const setupUrl = `${APP_URL}/it/imposta-password?token=${token}`;

  await sendCantinaAccountSetupEmail(
    cantina.user.email,
    cantina.user.name ?? cantina.name,
    cantina.name,
    setupUrl,
  );

  return NextResponse.json({ success: true });
}
