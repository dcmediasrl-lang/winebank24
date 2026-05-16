export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  slug: z.string().min(1),
  titleIt: z.string().min(1),
  titleEn: z.string().min(1),
  excerptIt: z.string().optional(),
  excerptEn: z.string().optional(),
  contentIt: z.string().min(1),
  contentEn: z.string().min(1),
  coverImage: z.string().optional(),
  category: z.string().optional(),
  isPublished: z.boolean(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await db.blogPost.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

    const wasPublished = existing.isPublished;
    const post = await db.blogPost.update({
      where: { id },
      data: {
        ...data,
        coverImage: data.coverImage || null,
        category: data.category || null,
        excerptIt: data.excerptIt || null,
        excerptEn: data.excerptEn || null,
        publishedAt: data.isPublished && !wasPublished ? new Date() : existing.publishedAt,
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;
  await db.blogPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
