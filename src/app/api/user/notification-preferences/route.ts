export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getNotificationPreferences } from "@/lib/notifications";

const schema = z.object({
  inAppOffers: z.boolean().optional(),
  inAppSales: z.boolean().optional(),
  inAppPurchase: z.boolean().optional(),
  emailOffers: z.boolean().optional(),
  emailSales: z.boolean().optional(),
  emailPurchase: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  return NextResponse.json(await getNotificationPreferences(session.user.id));
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });

  await db.notificationPreference.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: parsed.data,
  });
  return NextResponse.json({ success: true });
}
