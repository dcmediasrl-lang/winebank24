export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTRACT_CANTINA_VERSION } from "@/lib/contracts";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
  if (!cantina) return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });

  await db.cantina.update({
    where: { id: cantina.id },
    data: {
      contractAcceptedAt: new Date(),
      contractVersion: CONTRACT_CANTINA_VERSION,
    },
  });

  await logActivity(session.user.id, "KYC_SUBMITTED", `Contratto Cantina accettato — ${CONTRACT_CANTINA_VERSION}`);

  return NextResponse.json({ success: true });
}
