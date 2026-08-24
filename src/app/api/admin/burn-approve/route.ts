export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { burnNft } from "@/lib/blockchain";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  const { burnRequestId, nftId } = await req.json();

  const nft = await db.nft.findUnique({ where: { id: nftId } });
  if (!nft) return NextResponse.json({ error: "NFT non trovato" }, { status: 404 });
  if (nft.status !== "BURN_REQUESTED") {
    return NextResponse.json({ error: "Nessuna richiesta di burn in attesa per questo NFT" }, { status: 400 });
  }

  let txHash: string | undefined;

  // Burn on-chain se il token è stato mintato
  if (nft.tokenId !== null && process.env.NFT_CONTRACT_ADDRESS) {
    try {
      const result = await burnNft(nft.tokenId, "Richiesta consegna bottiglia fisica");
      txHash = result.txHash;
    } catch (e) {
      console.error("Burn on-chain fallito:", e);
    }
  }

  await db.$transaction([
    db.nft.update({
      where: { id: nftId },
      // Il certificato digitale non esiste più: incrementare la versione lo
      // invalida nella pagina di verifica pubblica, senza emetterne uno nuovo
      data: { status: "BURNED", isListed: false, certificateVersion: { increment: 1 } },
    }),
    db.burnRequest.update({
      where: { id: burnRequestId },
      data: { approved: true, processedAt: new Date() },
    }),
    // Il certificato non esiste più: rifiuta le offerte pendenti
    db.offer.updateMany({
      where: { nftId, status: "PENDING" },
      data: { status: "REJECTED" },
    }),
    db.transaction.create({
      data: {
        nftId,
        type: "BURN",
        amount: 0,
        paymentMethod: "FIAT",
        txHash,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
