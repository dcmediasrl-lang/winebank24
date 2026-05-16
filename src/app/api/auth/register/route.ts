export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, rateLimitKey, getClientIp } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.literal("COLLECTOR"),
  // KYC light
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  birthDate: z.string().min(1), // ISO date string
  country: z.string().min(2),
  fiscalCode: z.string().optional(),
});

export async function POST(req: Request) {
  // Rate limit: max 5 registrations per IP per hour
  const ip = getClientIp(req);
  const { allowed } = await rateLimit(rateLimitKey(ip, "register"), 5, 3600);
  if (!allowed) {
    return NextResponse.json(
      { error: "Troppi tentativi. Riprova tra un'ora." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email già registrata" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(data.password, 12);
    const verifyToken = randomBytes(32).toString("hex");
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashed,
        role: "COLLECTOR",
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: new Date(data.birthDate),
        country: data.country,
        fiscalCode: data.fiscalCode,
        emailVerifyToken: verifyToken,
        emailVerifyExpiry: verifyExpiry,
      },
    });

    await logActivity(user.id, "REGISTER", `IP: ${ip}`);

    // Send verification email (non-blocking)
    await sendVerificationEmail(data.email, verifyToken);

    return NextResponse.json({
      success: true,
      userId: user.id,
      message: "Controlla la tua email per verificare l'account.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("[register]", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
