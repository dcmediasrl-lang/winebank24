export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  titleIt: z.string().min(1).max(200).optional(),
  titleEn: z.string().max(200).optional(),
  excerptIt: z.string().max(500).optional(),
  excerptEn: z.string().max(500).optional(),
  contentIt: z.string().min(1).optional(),
  contentEn: z.string().optional(),
  coverImage: z.string().url().or(z.literal("")).optional(),
  category: z.string().max(60).optional(),
  isPublished: z.boolean().optional(),
});

async function getOwnedPost(postId: string, userId: string) {
  const cantina = await db.cantina.findUnique({ where: { userId } });
  if (!cantina) return null;
  return db.blogPost.findFirst({ where: { id: postId, cantinaId: cantina.id } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }
  const { id } = await params;
  const post = await getOwnedPost(id, session.user.id);
  if (!post) return NextResponse.json({ error: "Articolo non trovato" }, { status: 404 });

  try {
    const body = schema.parse(await req.json());
    const wasPublished = post.isPublished;
    const updated = await db.blogPost.update({
      where: { id },
      data: {
        ...(body.titleIt !== undefined ? { titleIt: body.titleIt } : {}),
        ...(body.titleEn !== undefined ? { titleEn: body.titleEn } : {}),
        ...(body.excerptIt !== undefined ? { excerptIt: body.excerptIt || null } : {}),
        ...(body.excerptEn !== undefined ? { excerptEn: body.excerptEn || null } : {}),
        ...(body.contentIt !== undefined ? { contentIt: body.contentIt } : {}),
        ...(body.contentEn !== undefined ? { contentEn: body.contentEn || undefined } : {}),
        ...(body.coverImage !== undefined ? { coverImage: body.coverImage || null } : {}),
        ...(body.category !== undefined ? { category: body.category || null } : {}),
        ...(body.isPublished !== undefined ? {
          isPublished: body.isPublished,
          publishedAt: body.isPublished && !wasPublished ? new Date() : post.publishedAt,
        } : {}),
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }
  const { id } = await params;
  const post = await getOwnedPost(id, session.user.id);
  if (!post) return NextResponse.json({ error: "Articolo non trovato" }, { status: 404 });

  await db.blogPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
