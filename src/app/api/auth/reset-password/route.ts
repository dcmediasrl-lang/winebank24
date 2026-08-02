export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { rateLimit, rateLimitKey, getClientIp } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  token: z.string().min(32),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = await rateLimit(rateLimitKey(ip, "reset-password"), 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Troppi tentativi. Riprova più tardi." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const user = await db.user.findFirst({
    where: { passwordResetToken: tokenHash },
    select: { id: true, passwordResetExpiry: true, isBlocked: true },
  });

  if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
    return NextResponse.json({ error: "Link non valido o scaduto. Richiedine uno nuovo." }, { status: 400 });
  }
  if (user.isBlocked) {
    return NextResponse.json({ error: "Account non disponibile" }, { status: 403 });
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12);

  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      // Il token è monouso e l'eventuale blocco per tentativi falliti viene rimosso
      passwordResetToken: null,
      passwordResetExpiry: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await logActivity(user.id, "PASSWORD_RESET_COMPLETED", `IP: ${ip}`);
  return NextResponse.json({ success: true });
}
