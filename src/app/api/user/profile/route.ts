import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileSchema = z.object({
  username: z
    .string()
    .regex(/^[a-zA-Z0-9_]{3,20}$/, "Username must be 3-20 characters: letters, numbers, underscore only")
    .optional()
    .nullable(),
  avatarUrl: z.string().url("Invalid URL").optional().nullable(),
});

export async function PATCH(request: Request) {
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

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { username, avatarUrl } = parsed.data;

  // Check username uniqueness (if provided)
  if (username) {
    const existing = await db.user.findUnique({ where: { username } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(username !== undefined ? { username } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json(updated);
}
