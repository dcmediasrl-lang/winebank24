export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { sendCantinaInvite } from "@/lib/cantina-invite";

const schema = z.object({
  cantinaName: z.string().min(2),
  description: z.string().optional(),
  location: z.string().optional(),
  vatNumber: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
  royaltyPct: z.number().min(0).max(50).optional(),
  contactName: z.string().min(2),
  email: z.string().email(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  try {
    const body = schema.parse(await req.json());

    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return NextResponse.json({ error: "Email già registrata" }, { status: 400 });
    }

    // Nessuna password: la cantina la imposta lei stessa dal link di
    // attivazione, senza che transiti mai in un'email
    const user = await db.user.create({
      data: {
        name: body.contactName,
        email: body.email,
        role: "CANTINA",
        cantina: {
          create: {
            name: body.cantinaName,
            description: body.description || null,
            location: body.location || null,
            vatNumber: body.vatNumber || null,
            website: body.website || null,
            logoUrl: body.logoUrl || null,
            royaltyPct: body.royaltyPct ?? 5.0,
            isVerified: true,
          },
        },
      },
    });

    await sendCantinaInvite({
      userId: user.id,
      email: body.email,
      contactName: body.contactName,
      cantinaName: body.cantinaName,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
