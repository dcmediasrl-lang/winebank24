export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }

  const user = await db.user.findFirst({
    where: {
      emailVerifyToken: body.token,
      emailVerifyExpiry: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Link non valido o scaduto. Chiedi all'amministratore di reinviare l'email." },
      { status: 400 },
    );
  }

  const hashed = await bcrypt.hash(body.password, 12);

  await db.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      emailVerifyToken: null,
      emailVerifyExpiry: null,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
