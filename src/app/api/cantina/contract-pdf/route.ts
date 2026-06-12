export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateContractPdf } from "@/lib/contract-pdf";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const cantina = await db.cantina.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true } } },
  });

  if (!cantina) {
    return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });
  }

  if (!cantina.contractAcceptedAt) {
    return NextResponse.json({ error: "Contratto non ancora accettato" }, { status: 400 });
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateContractPdf(
      cantina.name,
      cantina.user.email,
      cantina.contractAcceptedAt,
    );
  } catch (err) {
    console.error("[contract-pdf] generation error:", err);
    return NextResponse.json({ error: "Errore nella generazione del PDF" }, { status: 500 });
  }

  if (!pdfBytes || pdfBytes.length === 0) {
    return NextResponse.json({ error: "PDF generato vuoto" }, { status: 500 });
  }

  const safeName = cantina.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  // pdf-lib returns Uint8Array<ArrayBufferLike>; slice gives a concrete ArrayBuffer accepted by BodyInit
  const ab = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  ) as ArrayBuffer;

  return new Response(ab, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="contratto_creator_${safeName}.pdf"`,
      "Content-Length": pdfBytes.byteLength.toString(),
    },
  });
}
