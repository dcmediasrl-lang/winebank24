export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }
  const { configId, platformFeePct, cantinaFeePct } = await req.json();
  await db.platformConfig.update({
    where: { id: configId },
    data: { platformFeePct, cantinaFeePct },
  });
  return NextResponse.json({ success: true });
}
