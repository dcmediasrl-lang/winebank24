export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug: solo lettere minuscole, numeri e trattini"),
  titleIt: z.string().min(1, "Titolo obbligatorio").max(200),
  titleEn: z.string().max(200).optional(),
  excerptIt: z.string().max(500).optional(),
  excerptEn: z.string().max(500).optional(),
  contentIt: z.string().min(1, "Contenuto obbligatorio"),
  contentEn: z.string().optional(),
  coverImage: z.string().url().or(z.literal("")).optional(),
  category: z.string().max(60).optional(),
  isPublished: z.boolean().default(false),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
  if (!cantina) return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });

  try {
    const body = schema.parse(await req.json());

    const existing = await db.blogPost.findUnique({ where: { slug: body.slug } });
    if (existing) return NextResponse.json({ error: "Slug già in uso" }, { status: 400 });

    const post = await db.blogPost.create({
      data: {
        slug: body.slug,
        titleIt: body.titleIt,
        titleEn: body.titleEn || body.titleIt,
        excerptIt: body.excerptIt || null,
        excerptEn: body.excerptEn || body.excerptIt || null,
        contentIt: body.contentIt,
        contentEn: body.contentEn || body.contentIt,
        coverImage: body.coverImage || null,
        category: body.category || null,
        isPublished: body.isPublished,
        publishedAt: body.isPublished ? new Date() : null,
        authorId: session.user.id,
        cantinaId: cantina.id,
      },
    });
    return NextResponse.json(post, { status: 201 });
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
  const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
  if (!cantina) return NextResponse.json([]);

  const posts = await db.blogPost.findMany({
    where: { cantinaId: cantina.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}
