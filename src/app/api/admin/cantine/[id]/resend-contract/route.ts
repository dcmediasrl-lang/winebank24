export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateContractPdf } from "@/lib/contract-pdf";
import { sendContractEmail } from "@/lib/email";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { id } = await params;

  const cantina = await db.cantina.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });

  if (!cantina) {
    return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });
  }

  if (!cantina.contractAcceptedAt) {
    return NextResponse.json(
      { error: "Questa cantina non ha ancora accettato il contratto" },
      { status: 400 },
    );
  }

  // Generate PDF
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateContractPdf(
      cantina.name,
      cantina.user.email,
      cantina.contractAcceptedAt,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[resend-contract] PDF generation error:", msg);
    return NextResponse.json({ error: `Errore generazione PDF: ${msg}` }, { status: 500 });
  }

  // Send email — let errors bubble so admin sees the real Brevo error
  try {
    await sendContractEmail(cantina.user.email, cantina.name, pdfBytes);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[resend-contract] Email error:", msg);
    return NextResponse.json({ error: `Errore invio email: ${msg}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, sentTo: cantina.user.email });
}
