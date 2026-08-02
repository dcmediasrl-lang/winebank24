export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { validateTaxId, normalizeTaxId, getTaxIdSpec } from "@/lib/tax-id";

const schema = z.object({
  firstName:  z.string().min(2, "Nome obbligatorio"),
  lastName:   z.string().min(2, "Cognome obbligatorio"),
  birthDate:  z.string().min(1, "Data di nascita obbligatoria"),
  country:    z.string().min(2, "Paese obbligatorio"),
  fiscalCode: z.string().min(3, "Codice identificativo obbligatorio"),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());

    // Verify age >= 18
    const birth = new Date(body.birthDate);
    const age = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 18) {
      return NextResponse.json({ error: "Devi essere maggiorenne per utilizzare la piattaforma" }, { status: 400 });
    }

    // Paese supportato + validazione codice: formato, checksum e
    // controllo incrociato con nome/cognome/data dove il codice li contiene
    if (!getTaxIdSpec(body.country)) {
      return NextResponse.json({ error: "Paese non supportato" }, { status: 400 });
    }
    const taxError = validateTaxId(body.country, body.fiscalCode, {
      firstName: body.firstName,
      lastName: body.lastName,
      birthDate: birth,
    });
    if (taxError) {
      return NextResponse.json({ error: taxError }, { status: 400 });
    }

    // Unicità: lo stesso codice non può essere registrato da due utenti
    const normalized = normalizeTaxId(body.fiscalCode, body.country);
    const taken = await db.user.findFirst({
      where: { fiscalCode: normalized, id: { not: session.user.id } },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.json(
        { error: "Questo codice identificativo risulta già registrato da un altro account" },
        { status: 409 }
      );
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        firstName:  body.firstName,
        lastName:   body.lastName,
        birthDate:  birth,
        country:    body.country,
        fiscalCode: normalized,
        name: `${body.firstName} ${body.lastName}`,
      },
    });

    await logActivity(session.user.id, "KYC_COMPLETED", `Paese: ${body.country}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[kyc]", err);
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 });
  }
}
