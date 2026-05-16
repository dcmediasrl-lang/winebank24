export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  firstName:  z.string().min(2, "Nome obbligatorio"),
  lastName:   z.string().min(2, "Cognome obbligatorio"),
  birthDate:  z.string().min(1, "Data di nascita obbligatoria"),
  country:    z.string().min(2, "Paese obbligatorio"),
  fiscalCode: z.string().min(3, "Codice fiscale / documento obbligatorio"),
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

    await db.user.update({
      where: { id: session.user.id },
      data: {
        firstName:  body.firstName,
        lastName:   body.lastName,
        birthDate:  birth,
        country:    body.country,
        fiscalCode: body.fiscalCode,
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
