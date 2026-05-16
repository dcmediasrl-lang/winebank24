export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTRACT_BUYER_VERSION } from "@/lib/contracts";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  await db.user.update({
    where: { id: session.user.id },
    data: {
      buyerContractAcceptedAt: new Date(),
      buyerContractVersion: CONTRACT_BUYER_VERSION,
    },
  });

  await logActivity(session.user.id, "KYC_SUBMITTED", `Termini Acquirente accettati — ${CONTRACT_BUYER_VERSION}`);

  return NextResponse.json({ success: true });
}
