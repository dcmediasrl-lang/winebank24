export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendWelcomeCantinaEmail } from "@/lib/email";

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
  password: z.string().min(6),
  sendWelcomeEmail: z.boolean().optional(),
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

    const hashed = await bcrypt.hash(body.password, 12);

    await db.user.create({
      data: {
        name: body.contactName,
        email: body.email,
        password: hashed,
        role: "CANTINA",
        emailVerified: new Date(), // auto-verified since created by admin
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

    // Send welcome email if requested
    if (body.sendWelcomeEmail !== false) {
      await sendWelcomeCantinaEmail(body.email, body.contactName, body.cantinaName, body.password);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
