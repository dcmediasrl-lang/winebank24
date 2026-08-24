import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

const WINE_RED = rgb(0.6, 0.13, 0.0);
const BLACK = rgb(0.1, 0.05, 0.05);
const GRAY = rgb(0.45, 0.42, 0.42);
const WHITE = rgb(1, 1, 1);
const CREAM = rgb(0.96, 0.93, 0.9);

export interface CertificateData {
  serial: string;
  version: number;
  nftName: string;
  vintage: number | null;
  cantinaName: string;
  bottleFormat: string | null;
  bottleNumber: number;
  ownerName: string;
  issuedAt: Date;
  imageUrl: string | null;
  verifyUrl: string;
}

/** Scarica un'immagine remota e ne rileva il formato per l'embed in pdf-lib */
async function fetchImage(url: string): Promise<{ bytes: Uint8Array; type: "jpg" | "png" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (contentType.includes("png")) return { bytes, type: "png" };
    if (contentType.includes("jpeg") || contentType.includes("jpg")) return { bytes, type: "jpg" };
    return null;
  } catch {
    return null;
  }
}

/**
 * Certificato di proprietà: seriale + QR verso la verifica pubblica + foto
 * della bottiglia. Il documento resta valido come prova solo finché la
 * verifica online conferma che la versione non è cambiata (vedi Nft.certificateVersion).
 */
export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  const page = doc.addPage([pageWidth, pageHeight]);

  // Header
  page.drawRectangle({ x: 0, y: pageHeight - 76, width: pageWidth, height: 76, color: WINE_RED });
  page.drawText("WINE BANK 24", { x: margin, y: pageHeight - 32, size: 20, font: bold, color: WHITE });
  page.drawText("Certificato di Proprietà — Bottiglia da Collezione", {
    x: margin, y: pageHeight - 52, size: 10, font: regular, color: rgb(1, 0.85, 0.7),
  });
  page.drawText(`Seriale ${data.serial} · v${data.version}`, {
    x: margin, y: pageHeight - 66, size: 8.5, font: italic, color: rgb(1, 0.85, 0.7),
  });

  let y = pageHeight - 110;

  // Bottle photo (left) + details (right)
  const photoBoxSize = 200;
  const photoBoxY = y - photoBoxSize;

  page.drawRectangle({
    x: margin, y: photoBoxY, width: photoBoxSize, height: photoBoxSize,
    color: CREAM, borderColor: WINE_RED, borderWidth: 0.5,
  });

  if (data.imageUrl) {
    const img = await fetchImage(data.imageUrl);
    if (img) {
      try {
        const embedded = img.type === "png" ? await doc.embedPng(img.bytes) : await doc.embedJpg(img.bytes);
        const scale = Math.min(photoBoxSize / embedded.width, photoBoxSize / embedded.height);
        const w = embedded.width * scale;
        const h = embedded.height * scale;
        page.drawImage(embedded, {
          x: margin + (photoBoxSize - w) / 2,
          y: photoBoxY + (photoBoxSize - h) / 2,
          width: w,
          height: h,
        });
      } catch {
        // Immagine non incorporabile: il certificato resta valido senza foto
      }
    }
  }
  if (!data.imageUrl) {
    page.drawText("Nessuna fotografia", {
      x: margin + 20, y: photoBoxY + photoBoxSize / 2, size: 9, font: italic, color: GRAY,
    });
  }

  const detailX = margin + photoBoxSize + 24;
  const detailWidth = contentWidth - photoBoxSize - 24;
  let dy = y - 4;

  function detail(label: string, value: string, size = 11) {
    page.drawText(label.toUpperCase(), { x: detailX, y: dy, size: 7.5, font: bold, color: WINE_RED });
    dy -= 14;
    page.drawText(value, { x: detailX, y: dy, size, font: bold, color: BLACK, maxWidth: detailWidth });
    dy -= 24;
  }

  detail("Bottiglia", `${data.nftName}${data.vintage ? ` — ${data.vintage}` : ""}`, 13);
  detail("Cantina produttrice", data.cantinaName);
  if (data.bottleFormat) detail("Formato", data.bottleFormat);
  detail("Numero bottiglia", `#${data.bottleNumber}`);
  detail("Intestato a", data.ownerName);

  y = Math.min(photoBoxY, dy) - 24;

  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: WINE_RED });
  y -= 24;

  // QR + verification box
  const qrSize = 110;
  const qrPng = await QRCode.toBuffer(data.verifyUrl, { type: "png", margin: 1, width: qrSize * 3 });
  const qrImage = await doc.embedPng(qrPng);
  page.drawImage(qrImage, { x: margin, y: y - qrSize, width: qrSize, height: qrSize });

  const verifyX = margin + qrSize + 20;
  const verifyWidth = contentWidth - qrSize - 20;
  let vy = y - 14;
  page.drawText("VERIFICA LA VALIDITÀ", { x: verifyX, y: vy, size: 9, font: bold, color: WINE_RED });
  vy -= 16;
  const verifyLines = wrapText(
    "Inquadra il QR code o apri il link per controllare in tempo reale se questo certificato è ancora valido. Diventa automaticamente non valido in caso di cessione del certificato o di riscatto della bottiglia.",
    regular, 9, verifyWidth,
  );
  for (const line of verifyLines) {
    page.drawText(line, { x: verifyX, y: vy, size: 9, font: regular, color: BLACK });
    vy -= 13;
  }
  vy -= 6;
  page.drawText(data.verifyUrl, { x: verifyX, y: vy, size: 8, font: italic, color: rgb(0.6, 0.13, 0.0) });

  y = y - qrSize - 20;

  const dateStr = data.issuedAt.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  page.drawText(`Certificato emesso il ${dateStr}, alla conferma del pagamento.`, {
    x: margin, y, size: 8.5, font: italic, color: GRAY,
  });
  y -= 30;

  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: rgb(0.85, 0.8, 0.78) });
  y -= 16;
  const disclaimer = wrapText(
    "Wine Bank 24 è progettata come piattaforma per il collezionismo e la compravendita di bottiglie fisiche. " +
    "Non offre consulenza finanziaria, rendimenti, interessi o garanzie di rivalutazione. Questo documento attesta la " +
    "proprietà del certificato digitale collegato alla bottiglia descritta, alla data e alla versione indicate sopra.",
    italic, 7.5, contentWidth,
  );
  for (const line of disclaimer) {
    page.drawText(line, { x: margin, y, size: 7.5, font: italic, color: GRAY });
    y -= 11;
  }

  return doc.save();
}

function wrapText(text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
