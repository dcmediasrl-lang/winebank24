import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const wishlistItemSchema = z.object({
  wineName: z.string().min(1, "Wine name is required"),
  cantina: z.string().optional().nullable(),
  vintage: z.string().optional().nullable(),
  grape: z.string().optional().nullable(),
  maxPrice: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = wishlistItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { wineName, cantina, vintage, grape, maxPrice, notes } = parsed.data;

  const item = await db.wishlistItem.create({
    data: {
      userId: session.user.id,
      wineName,
      cantina: cantina ?? null,
      vintage: vintage ?? null,
      grape: grape ?? null,
      maxPrice: maxPrice ?? null,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
