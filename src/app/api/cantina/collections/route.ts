export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  cantinaId: z.string(),
  name: z.string().min(2),
  description: z.string().optional(),
  vintage: z.number().optional(),
  grape: z.string().optional(),
  region: z.string().optional(),
  totalSupply: z.number().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  try {
    const body = schema.parse(await req.json());
    const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
    if (!cantina || cantina.id !== body.cantinaId) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const collection = await db.collection.create({ data: body });
    return NextResponse.json(collection);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
