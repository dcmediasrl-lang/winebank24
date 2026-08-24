import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { uploadToR2 } from "@/lib/storage";
import { generateCertificatePdf } from "@/lib/certificate-pdf";
import { sendCertificateEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.winebank24.eu";

function generateSerial(): string {
  return `WB24-${randomBytes(5).toString("hex").toUpperCase()}`;
}

/**
 * Emette il certificato di proprietà per il proprietario attuale di un NFT
 * intero, dopo che il pagamento è stato confermato dal webhook Stripe.
 * Non blocca la vendita se fallisce: il pagamento e il trasferimento di
 * proprietà sono già stati confermati e registrati prima di questa chiamata,
 * l'emissione del PDF può essere ripetuta in un secondo momento se necessario.
 */
export async function issueCertificate(params: {
  nftId: string;
  ownerId: string;
  transactionId?: string;
}): Promise<void> {
  try {
    const nft = await db.nft.findUnique({
      where: { id: params.nftId },
      select: {
        name: true,
        vintage: true,
        bottleFormat: true,
        bottleNumber: true,
        imageUrl: true,
        certificateVersion: true,
        cantina: { select: { name: true } },
      },
    });
    const owner = await db.user.findUnique({
      where: { id: params.ownerId },
      select: { name: true, email: true, firstName: true, lastName: true },
    });
    if (!nft || !owner) return;

    const ownerName =
      owner.firstName && owner.lastName ? `${owner.firstName} ${owner.lastName}` : owner.name || owner.email;

    let serial = generateSerial();
    // Probabilità di collisione trascurabile (10 caratteri esadecimali), ma un
    // seriale duplicato romperebbe il vincolo @unique: qualche tentativo in più
    // costa nulla ed evita di far fallire un'emissione per sfortuna statistica.
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await db.certificate.findUnique({ where: { serial }, select: { id: true } });
      if (!existing) break;
      serial = generateSerial();
    }

    const verifyUrl = `${APP_URL}/it/certificato/${serial}`;

    const pdfBytes = await generateCertificatePdf({
      serial,
      version: nft.certificateVersion,
      nftName: nft.name,
      vintage: nft.vintage,
      cantinaName: nft.cantina.name,
      bottleFormat: nft.bottleFormat,
      bottleNumber: nft.bottleNumber,
      ownerName,
      issuedAt: new Date(),
      imageUrl: nft.imageUrl,
      verifyUrl,
    });

    const { url: pdfUrl } = await uploadToR2(
      Buffer.from(pdfBytes),
      `${serial}.pdf`,
      "application/pdf",
      "certificati",
    );

    await db.certificate.create({
      data: {
        nftId: params.nftId,
        ownerId: params.ownerId,
        serial,
        version: nft.certificateVersion,
        pdfUrl,
        transactionId: params.transactionId,
      },
    });

    await sendCertificateEmail(owner.email, nft.name, pdfBytes, serial);
  } catch (err) {
    console.error("[certificate] Emissione fallita per NFT", params.nftId, err);
  }
}
