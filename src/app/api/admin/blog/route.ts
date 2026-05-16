export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers and hyphens"),
  titleIt: z.string().min(1),
  titleEn: z.string().min(1),
  excerptIt: z.string().optional(),
  excerptEn: z.string().optional(),
  contentIt: z.string().min(1),
  contentEn: z.string().min(1),
  coverImage: z.string().optional(),
  category: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await db.blogPost.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug già in uso" }, { status: 400 });
    }

    const post = await db.blogPost.create({
      data: {
        ...data,
        authorId: session.user.id,
        publishedAt: data.isPublished ? new Date() : null,
        coverImage: data.coverImage || null,
        category: data.category || null,
        excerptIt: data.excerptIt || null,
        excerptEn: data.excerptEn || null,
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

export async function GET() {
  const posts = await db.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}
