import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { metadatiPagina } from "@/lib/seo";
import { ShieldCheck, ShieldAlert, Hash, Calendar, Wine, Package, PieChart } from "lucide-react";

/**
 * Pagina pubblica dietro al QR code stampato sul certificato PDF. Non mostra
 * mai l'identità del proprietario attuale (privacy): conferma solo se il
 * certificato è ancora valido confrontando la sua versione con quella
 * corrente della bottiglia — che cambia a ogni cessione o riscatto.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string; serial: string }> }): Promise<Metadata> {
  const { lang, serial } = await params;
  const en = lang === "en";
  return metadatiPagina({
    lang, path: `/certificato/${serial}`, noIndex: true,
    titolo: en ? `Certificate verification — ${serial}` : `Verifica certificato — ${serial}`,
    descrizione: en
      ? "Check whether this Wine Bank 24 ownership certificate is still valid."
      : "Controlla se questo certificato di proprietà Wine Bank 24 è ancora valido.",
  });
}

export default async function CertificatoPage({ params }: { params: Promise<{ lang: string; serial: string }> }) {
  const { lang, serial } = await params;
  const en = lang === "en";

  const certificate = await db.certificate.findUnique({
    where: { serial },
    include: {
      nft: {
        select: {
          name: true,
          vintage: true,
          bottleNumber: true,
          bottleFormat: true,
          imageUrl: true,
          status: true,
          certificateVersion: true,
          cantina: { select: { name: true } },
        },
      },
      fraction: { select: { ownerId: true, percentage: true, certificateVersion: true } },
    },
  });

  if (!certificate) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center" style={{ color: "white" }}>
        <ShieldAlert className="w-12 h-12 text-white/30 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">
          {en ? "Certificate not found" : "Certificato non trovato"}
        </h1>
        <p className="text-white/50 text-sm">
          {en
            ? "Check the serial number or QR code — it may not correspond to any Wine Bank 24 certificate."
            : "Controlla il numero di serie o il QR code: potrebbe non corrispondere a nessun certificato Wine Bank 24."}
        </p>
      </div>
    );
  }

  const { nft, fraction } = certificate;
  const isFraction = !!fraction;
  const isBurned = nft.status === "BURNED";
  const fractionSold = isFraction && (Number(fraction.percentage) <= 0 || fraction.ownerId !== certificate.ownerId);
  const isValid = isFraction
    ? certificate.version === fraction.certificateVersion && !fractionSold && !isBurned
    : certificate.version === nft.certificateVersion && !isBurned;

  return (
    <div className="max-w-lg mx-auto px-4 py-10" style={{ color: "white" }}>
      {/* Status banner */}
      <div
        className={`rounded-2xl border p-5 mb-6 flex items-start gap-3 ${
          isValid
            ? "bg-green-900/20 border-green-700/40"
            : "bg-red-900/20 border-red-700/40"
        }`}
      >
        {isValid ? (
          <ShieldCheck className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
        )}
        <div>
          <p className={`font-bold ${isValid ? "text-green-400" : "text-red-400"}`}>
            {isValid
              ? en ? "Valid certificate" : "Certificato valido"
              : en ? "No longer valid" : "Non più valido"}
          </p>
          <p className="text-sm text-white/60 mt-1">
            {isValid
              ? isFraction
                ? en
                  ? `Ownership of this ${Number(fraction.percentage).toFixed(4)}% share matches what was recorded when this document was issued.`
                  : `Il possesso di questa quota del ${Number(fraction.percentage).toFixed(4)}% corrisponde a quanto registrato al momento dell'emissione.`
                : en
                ? "Ownership of this bottle's certificate matches what was recorded when this document was issued."
                : "La proprietà del certificato di questa bottiglia corrisponde a quanto registrato al momento dell'emissione."
              : isBurned
              ? en
                ? "This bottle has been physically redeemed: the digital certificate has been withdrawn."
                : "Questa bottiglia è stata riscattata fisicamente: il certificato digitale è stato ritirato."
              : isFraction
              ? en
                ? "The share this certificate refers to has changed since this document was issued."
                : "La quota a cui si riferisce questo certificato è cambiata da quando è stato emesso questo documento."
              : en
              ? "Ownership of this certificate has changed since this document was issued."
              : "La proprietà di questo certificato è cambiata da quando è stato emesso questo documento."}
          </p>
        </div>
      </div>

      {isFraction && (
        <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 px-4 py-3 mb-6 text-xs text-amber-300/80 leading-relaxed">
          {en
            ? "This certificate attests co-ownership of a share of the digital certificate linked to the bottle below. It does not by itself entitle the holder to physical redemption of the bottle, which requires acquiring 100% of the shares."
            : "Questo certificato attesta la comproprietà di una quota del certificato digitale collegato alla bottiglia sottostante. Non dà da solo diritto al ritiro fisico della bottiglia, possibile solo acquisendo il 100% delle quote."}
        </div>
      )}

      {/* Bottle card */}
      <div className="rounded-2xl border border-[var(--wine-border)] bg-[#1a0f0f] overflow-hidden">
        <div className="relative aspect-video bg-[#231515]">
          {nft.imageUrl ? (
            <Image src={nft.imageUrl} alt={nft.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Wine className="w-10 h-10 text-white/20" />
            </div>
          )}
        </div>
        <div className="p-5 space-y-3">
          <div>
            <h1 className="text-lg font-bold text-white">
              {nft.name}{nft.vintage ? ` — ${nft.vintage}` : ""}
            </h1>
            <p className="text-sm text-white/40">{nft.cantina.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-white/10">
            <div>
              <p className="text-white/40 text-xs flex items-center gap-1 mb-0.5">
                <Hash className="w-3 h-3" /> {en ? "Serial" : "Numero di serie"}
              </p>
              <p className="font-mono text-white/80">{certificate.serial}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs flex items-center gap-1 mb-0.5">
                <Package className="w-3 h-3" /> {en ? "Bottle" : "Bottiglia"}
              </p>
              <p className="text-white/80">
                #{nft.bottleNumber}{nft.bottleFormat ? ` · ${nft.bottleFormat}` : ""}
              </p>
            </div>
            {isFraction && (
              <div>
                <p className="text-white/40 text-xs flex items-center gap-1 mb-0.5">
                  <PieChart className="w-3 h-3" /> {en ? "Share" : "Quota"}
                </p>
                <p className="text-white/80 font-semibold">{Number(certificate.percentage).toFixed(4)}%</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-white/40 text-xs flex items-center gap-1 mb-0.5">
                <Calendar className="w-3 h-3" /> {en ? "Issued on" : "Emesso il"}
              </p>
              <p className="text-white/80">
                {certificate.createdAt.toLocaleDateString(en ? "en-GB" : "it-IT", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-white/30 text-center mt-6">
        {en
          ? "This page always reflects the certificate's live status and never shows the current owner's identity."
          : "Questa pagina riflette sempre lo stato aggiornato del certificato e non mostra mai l'identità del proprietario attuale."}
      </p>

      <div className="text-center mt-4">
        <Link href={`/${lang}`} className="text-sm text-amber-500 hover:underline">
          Wine Bank 24
        </Link>
      </div>
    </div>
  );
}
