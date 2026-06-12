export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const patchSchema = z.object({
  // User fields
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  contactName: z.string().min(1).optional(),
  isBlocked: z.boolean().optional(),
  // Cantina fields
  cantinaName: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  vatNumber: z.string().optional().nullable(),
  royaltyPct: z.number().min(0).max(50).optional(),
  isVerified: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;
  const cantina = await db.cantina.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          isBlocked: true,
          emailVerified: true,
          createdAt: true,
        },
      },
      _count: { select: { nfts: true, collections: true } },
    },
  });

  if (!cantina) {
    return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });
  }

  return NextResponse.json(cantina);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;

  const cantina = await db.cantina.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!cantina) {
    return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  // If changing email, check uniqueness
  if (body.email) {
    const existing = await db.user.findUnique({ where: { email: body.email } });
    if (existing && existing.id !== cantina.userId) {
      return NextResponse.json({ error: "Email già in uso da un altro account" }, { status: 400 });
    }
  }

  // Build user update payload
  const userUpdate: Record<string, unknown> = {};
  if (body.email !== undefined) userUpdate.email = body.email;
  if (body.contactName !== undefined) userUpdate.name = body.contactName;
  if (body.isBlocked !== undefined) userUpdate.isBlocked = body.isBlocked;
  if (body.password) userUpdate.password = await bcrypt.hash(body.password, 12);

  // Build cantina update payload
  const cantinaUpdate: Record<string, unknown> = {};
  if (body.cantinaName !== undefined) cantinaUpdate.name = body.cantinaName;
  if (body.description !== undefined) cantinaUpdate.description = body.description || null;
  if (body.location !== undefined) cantinaUpdate.location = body.location || null;
  if (body.website !== undefined) cantinaUpdate.website = body.website || null;
  if (body.vatNumber !== undefined) cantinaUpdate.vatNumber = body.vatNumber || null;
  if (body.royaltyPct !== undefined) cantinaUpdate.royaltyPct = body.royaltyPct;
  if (body.isVerified !== undefined) cantinaUpdate.isVerified = body.isVerified;

  await db.$transaction([
    ...(Object.keys(userUpdate).length > 0
      ? [db.user.update({ where: { id: cantina.userId }, data: userUpdate })]
      : []),
    ...(Object.keys(cantinaUpdate).length > 0
      ? [db.cantina.update({ where: { id }, data: cantinaUpdate })]
      : []),
  ]);

  return NextResponse.json({ success: true });
}
