export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDeletionBlockers, anonymizeAccount } from "@/lib/account-deletion";
import { rateLimit, rateLimitKey, getClientIp } from "@/lib/rate-limit";
import { sendAccountDeletedEmail } from "@/lib/email";

// GET — cosa impedisce la cancellazione (mostrato nella pagina prima di procedere)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const blockers = await getDeletionBlockers(session.user.id);
  return NextResponse.json({ blockers, canDelete: blockers.length === 0 });
}

const schema = z.object({
  password: z.string().min(1, "Password obbligatoria"),
  confirm: z.literal("CANCELLA", {
    message: "Scrivi CANCELLA per confermare",
  }),
});

// DELETE — esegue l'anonimizzazione dopo verifica della password
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const ip = getClientIp(req);
  const { allowed } = await rateLimit(rateLimitKey(ip, "delete-account"), 5, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Troppi tentativi. Riprova più tardi." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, password: true, deletedAt: true },
  });
  if (!user || user.deletedAt) {
    return NextResponse.json({ error: "Account non disponibile" }, { status: 400 });
  }

  // Riautenticazione: impedisce che una sessione rubata cancelli l'account
  if (!user.password) {
    return NextResponse.json(
      { error: "Il tuo account non ha una password. Impostane una dalla sezione Sicurezza, poi riprova." },
      { status: 400 }
    );
  }
  const valid = await bcrypt.compare(parsed.data.password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Password non corretta" }, { status: 401 });
  }

  // Le posizioni aperte vanno chiuse prima: dopo l'anonimizzazione
  // l'utente non potrebbe più rivendicare certificati o offerte
  const blockers = await getDeletionBlockers(user.id);
  if (blockers.length > 0) {
    return NextResponse.json({ error: blockers[0].message, blockers }, { status: 409 });
  }

  const originalEmail = user.email;
  const removed = await anonymizeAccount(user.id);

  // Ultima comunicazione all'indirizzo originale, prima che sparisca dai nostri sistemi
  await sendAccountDeletedEmail(originalEmail);

  return NextResponse.json({ success: true, removed });
}
