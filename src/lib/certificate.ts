import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { uploadToR2 } from "@/lib/storage";
import { generateCertificatePdf } from "@/lib/certificate-pdf";
import { sendCertificateEmail, sendFractionCertificateEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.winebank24.eu";

function generateSerial(): string {
  return `WB24-${randomBytes(5).toString("hex").toUpperCase()}`;
}

/** Un seriale univoco, con qualche tentativo in più in caso di collisione (trascurabile ma non impossibile) */
async function uniqueSerial(): Promise<string> {
  let serial = generateSerial();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db.certificate.findUnique({ where: { serial }, select: { id: true } });
    if (!existing) break;
    serial = generateSerial();
  }
  return serial;
}

function ownerDisplayName(owner: { name: string | null; email: string; firstName: string | null; lastName: string | null }): string {
  return owner.firstName && owner.lastName ? `${owner.firstName} ${owner.lastName}` : owner.name || owner.email;
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

    const ownerName = ownerDisplayName(owner);
    const serial = await uniqueSerial();
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

/**
 * Emette il certificato di comproprietà per il titolare attuale di una quota,
 * dopo che il pagamento è stato confermato. Attesta solo la percentuale
 * posseduta, non il diritto al ritiro fisico della bottiglia (possibile solo
 * acquisendo il 100% delle quote). Va riemesso a ogni variazione della quota:
 * chi chiama questa funzione deve aver già incrementato
 * NftFraction.certificateVersion nella stessa transazione che ha modificato
 * la percentuale, così il certificato precedente risulta automaticamente
 * superato nella pagina di verifica pubblica.
 */
export async function issueFractionCertificate(params: {
  fractionId: string;
  transactionId?: string;
}): Promise<void> {
  try {
    const fraction = await db.nftFraction.findUnique({
      where: { id: params.fractionId },
      select: {
        nftId: true,
        ownerId: true,
        percentage: true,
        certificateVersion: true,
        nft: {
          select: {
            name: true, vintage: true, bottleFormat: true, bottleNumber: true, imageUrl: true,
            cantina: { select: { name: true } },
          },
        },
      },
    });
    // Percentuale a zero: la quota è stata interamente ceduta, nulla da certificare
    if (!fraction || Number(fraction.percentage) <= 0) return;

    const owner = await db.user.findUnique({
      where: { id: fraction.ownerId },
      select: { name: true, email: true, firstName: true, lastName: true },
    });
    if (!owner) return;

    const ownerName = ownerDisplayName(owner);
    const serial = await uniqueSerial();
    const verifyUrl = `${APP_URL}/it/certificato/${serial}`;
    const percentage = Number(fraction.percentage);

    const pdfBytes = await generateCertificatePdf({
      serial,
      version: fraction.certificateVersion,
      nftName: fraction.nft.name,
      vintage: fraction.nft.vintage,
      cantinaName: fraction.nft.cantina.name,
      bottleFormat: fraction.nft.bottleFormat,
      bottleNumber: fraction.nft.bottleNumber,
      ownerName,
      issuedAt: new Date(),
      imageUrl: fraction.nft.imageUrl,
      verifyUrl,
      percentage,
    });

    const { url: pdfUrl } = await uploadToR2(
      Buffer.from(pdfBytes),
      `${serial}.pdf`,
      "application/pdf",
      "certificati",
    );

    await db.certificate.create({
      data: {
        nftId: fraction.nftId,
        fractionId: params.fractionId,
        percentage,
        ownerId: fraction.ownerId,
        serial,
        version: fraction.certificateVersion,
        pdfUrl,
        transactionId: params.transactionId,
      },
    });

    await sendFractionCertificateEmail(owner.email, fraction.nft.name, percentage, pdfBytes, serial);
  } catch (err) {
    console.error("[certificate] Emissione quota fallita per frazione", params.fractionId, err);
  }
}
