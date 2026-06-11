export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Nome obbligatorio").max(120),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  website: z.string().url("URL non valido").or(z.literal("")).optional(),
  logoUrl: z.string().url("URL logo non valido").or(z.literal("")).optional(),
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
        name: body.name,
        description: body.description || null,
        location: body.location || null,
        website: body.website || null,
        logoUrl: body.logoUrl || null,
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
    select: { id: true, name: true, description: true, location: true, website: true, logoUrl: true, vatNumber: true, isVerified: true },
  });
  return NextResponse.json(cantina);
}
