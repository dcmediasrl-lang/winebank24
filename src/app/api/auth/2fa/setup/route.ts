export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const secret = generateSecret();
  const otpauth = generateURI({
    secret,
    issuer: "Wine Bank 24",
    label: session.user.email,
  });
  const qrCode = await QRCode.toDataURL(otpauth);

  // Store secret temporarily; enabled only after first OTP confirmation
  await db.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret, twoFactorEnabled: false },
  });

  return NextResponse.json({ secret, qrCode });
}
