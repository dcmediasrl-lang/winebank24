export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadToR2 } from "@/lib/storage";

const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
  if (!cantina) return NextResponse.json({ error: "Cantina non trovata" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Formato non supportato. Usa PDF, JPG o PNG." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File troppo grande. Limite 20 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url } = await uploadToR2(buffer, file.name, file.type, "insurance-docs");

  await db.cantina.update({
    where: { id: cantina.id },
    data: { insuranceDocUrl: url, insuranceUploadedAt: new Date() },
  });

  return NextResponse.json({ url });
}

export async function DELETE() {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  await db.cantina.updateMany({
    where: { userId: session.user.id },
    data: { insuranceDocUrl: null, insuranceUploadedAt: null },
  });

  return NextResponse.json({ success: true });
}
