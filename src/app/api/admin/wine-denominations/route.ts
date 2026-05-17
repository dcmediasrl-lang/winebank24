export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { region: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const denominations = await db.wineDenomination.findMany({
    where,
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(denominations);
}

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["DOCG", "DOC", "IGT"]),
  region: z.string().min(1),
  grapes: z.array(z.string()),
  wineTypes: z.array(z.string()),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await req.json());
    const denomination = await db.wineDenomination.create({ data: body });
    return NextResponse.json(denomination, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Errore nella creazione" }, { status: 500 });
  }
}
