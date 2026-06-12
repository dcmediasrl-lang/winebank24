export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nome obbligatorio").max(120).optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  website: z.string().url("URL non valido").or(z.literal("")).optional(),
  logoUrl: z.string().url("URL logo non valido").or(z.literal("")).optional(),
  // Payment fields
  iban: z.string().max(34).optional(),
  bic: z.string().max(11).optional(),
  bankName: z.string().max(100).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
  if (!cantina) return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });

  try {
    const body = schema.parse(await req.json());
    const updated = await db.cantina.update({
      where: { id: cantina.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.location !== undefined && { location: body.location || null }),
        ...(body.website !== undefined && { website: body.website || null }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl || null }),
        ...(body.iban !== undefined && { iban: body.iban || null }),
        ...(body.bic !== undefined && { bic: body.bic || null }),
        ...(body.bankName !== undefined && { bankName: body.bankName || null }),
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }
  const cantina = await db.cantina.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true, name: true, description: true, location: true,
      website: true, logoUrl: true, vatNumber: true, isVerified: true,
      iban: true, bic: true, bankName: true, stripeAccountId: true,
    },
  });
  return NextResponse.json(cantina);
}
