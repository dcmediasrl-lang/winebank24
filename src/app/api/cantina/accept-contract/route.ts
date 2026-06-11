export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTRACT_CANTINA_VERSION } from "@/lib/contracts";
import { logActivity } from "@/lib/activity";
import { generateContractPdf } from "@/lib/contract-pdf";
import { sendContractEmail } from "@/lib/email";

export async function POST() {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const cantina = await db.cantina.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true } } },
  });
  if (!cantina) return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });

  const acceptedAt = new Date();

  await db.cantina.update({
    where: { id: cantina.id },
    data: {
      contractAcceptedAt: acceptedAt,
      contractVersion: CONTRACT_CANTINA_VERSION,
    },
  });

  await logActivity(session.user.id, "KYC_SUBMITTED", `Contratto Cantina accettato — ${CONTRACT_CANTINA_VERSION}`);

  // Generate PDF and send email — non-blocking, doesn't delay the response
  generateContractPdf(cantina.name, cantina.user.email, acceptedAt)
    .then((pdfBytes) => sendContractEmail(cantina.user.email, cantina.name, pdfBytes))
    .catch((err) => console.error("[accept-contract] PDF/email error:", err));

  return NextResponse.json({ success: true });
}
