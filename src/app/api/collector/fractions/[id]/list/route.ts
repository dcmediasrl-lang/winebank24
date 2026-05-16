export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  isListed: z.boolean(),
  askingPrice: z.number().positive().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const { id } = await params;
  try {
    const body = schema.parse(await req.json());

    const fraction = await db.nftFraction.findUnique({ where: { id } });
    if (!fraction || fraction.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    await db.nftFraction.update({
      where: { id },
      data: {
        isListed: body.isListed,
        askingPrice: body.isListed ? (body.askingPrice ?? null) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Errore nell'aggiornamento della quota" }, { status: 500 });
  }
}
