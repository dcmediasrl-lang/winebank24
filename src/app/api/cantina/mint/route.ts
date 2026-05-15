export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  collectionId: z.string(),
  cantinaId: z.string(),
  name: z.string().min(1),
  bottleNumber: z.number().min(1),
  price: z.number().optional(),
  imageUrl: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url().optional()
  ),
});

const blockchainReady =
  process.env.PLATFORM_WALLET_PRIVATE_KEY &&
  process.env.PLATFORM_WALLET_PRIVATE_KEY !== "0x..." &&
  process.env.NFT_CONTRACT_ADDRESS &&
  process.env.NFT_CONTRACT_ADDRESS.length > 0;

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  try {
    const body = schema.parse(await req.json());

    const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
    if (!cantina || cantina.id !== body.cantinaId) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const collection = await db.collection.findUnique({ where: { id: body.collectionId } });
    if (!collection || collection.minted >= collection.totalSupply) {
      return NextResponse.json({ error: "Collezione esaurita o non trovata" }, { status: 400 });
    }

    const metadata = {
      name: body.name,
      description: `${cantina.name} — ${collection.name}`,
      image: body.imageUrl || "",
      attributes: [
        { trait_type: "Cantina", value: cantina.name },
        { trait_type: "Collezione", value: collection.name },
        { trait_type: "Numero Bottiglia", value: body.bottleNumber },
        { trait_type: "Annata", value: collection.vintage },
      ],
    };
    const tokenUri = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString("base64")}`;

    let txHash: string | undefined;
    let tokenId: number | null = null;

    // Minting on-chain solo se wallet e contratto sono configurati
    if (blockchainReady) {
      try {
        const { mintNft } = await import("@/lib/blockchain");
        const { ethers } = await import("ethers");
        const wallet = new ethers.Wallet(process.env.PLATFORM_WALLET_PRIVATE_KEY!);
        const result = await mintNft({
          toAddress: wallet.address,
          tokenUri,
          cantinaId: cantina.id,
          collectionId: collection.id,
          bottleNumber: body.bottleNumber.toString(),
          vintage: collection.vintage ?? 0,
        });
        txHash = result.txHash;
        tokenId = result.tokenId;
      } catch (blockchainErr) {
        console.error("Blockchain mint fallito, procedo solo su DB:", blockchainErr);
      }
    }

    const nft = await db.nft.create({
      data: {
        tokenId,
        txHash,
        contractAddress: process.env.NFT_CONTRACT_ADDRESS || null,
        collectionId: body.collectionId,
        cantinaId: body.cantinaId,
        ownerId: session.user.id,
        name: body.name,
        imageUrl: body.imageUrl || null,
        metadataUri: tokenUri,
        price: body.price,
        bottleNumber: body.bottleNumber,
        vintage: collection.vintage,
        // Se viene inserito un prezzo lo pubblichiamo subito nel marketplace
        isListed: !!body.price,
        status: body.price ? "LISTED" : "MINTED",
      },
    });

    await db.collection.update({
      where: { id: body.collectionId },
      data: { minted: { increment: 1 } },
    });

    await db.transaction.create({
      data: {
        nftId: nft.id,
        sellerId: session.user.id,
        type: "MINT",
        amount: 0,
        paymentMethod: "FIAT",
        txHash,
      },
    });

    return NextResponse.json({
      success: true,
      tokenId,
      txHash,
      nftId: nft.id,
      onChain: !!txHash,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Errore nel minting" }, { status: 500 });
  }
}
