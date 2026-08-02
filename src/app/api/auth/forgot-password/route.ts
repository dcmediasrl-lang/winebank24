export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, rateLimitKey, getClientIp } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = getClientIp(req);
  // Limite severo: impedisce di usare l'endpoint per scoprire quali email esistono
  const { allowed } = await rateLimit(rateLimitKey(ip, "forgot-password"), 5, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Troppi tentativi. Riprova più tardi." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  // Risposta identica in ogni caso: non riveliamo se l'email è registrata
  const genericOk = NextResponse.json({
    success: true,
    message: "Se l'indirizzo è registrato, riceverai un'email con le istruzioni.",
  });
  if (!parsed.success) return genericOk;

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, password: true, isBlocked: true },
  });

  // Nessuna email a utenti inesistenti, bloccati o registrati solo con Google
  if (!user || !user.password || user.isBlocked) return genericOk;

  // In database salviamo solo l'hash del token: se il DB trapelasse,
  // i token non sarebbero utilizzabili per prendere il controllo degli account
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: tokenHash,
      passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 ora
    },
  });

  await logActivity(user.id, "PASSWORD_RESET_REQUESTED", `IP: ${ip}`);
  await sendPasswordResetEmail(user.email, rawToken);

  return genericOk;
}
