export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Direct single-bottle minting — no collection step required
const schema = z.object({
  cantinaId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  vintage: z.number().min(1900).max(2100).optional(),
  grape: z.string().optional(),
  region: z.string().optional(),
  bottleNumber: z.number().min(1),
  price: z.number().positive().optional(),
  imageUrl: z.string().url({ message: "La foto della bottiglia è obbligatoria" }),
  imageGallery: z.array(z.string().url()).min(1).max(4).optional(),
  isFractionable: z.boolean().optional(),
  totalValue: z.number().positive().optional(),
  denominationId: z.string().optional(),
  bottleFormat: z.string().max(60).optional(),
  bottleStory: z.string().max(2000).optional(),
  currentLocation: z.string().max(300).optional(),
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

    // Auto-create a singleton collection to satisfy the DB relationship.
    // This is a technical detail — the UI never exposes collections.
    const collection = await db.collection.create({
      data: {
        cantinaId: cantina.id,
        name: body.name,
        description: body.description,
        vintage: body.vintage,
        grape: body.grape,
        region: body.region,
        totalSupply: 1,
        minted: 0,
      },
    });

    const isFractionable = !!body.isFractionable;

    const gallery = body.imageGallery ?? [body.imageUrl];
    const metadata = {
      name: body.name,
      description: body.description || `${cantina.name} — ${body.name}`,
      image: body.imageUrl,
      images: gallery,
      attributes: [
        { trait_type: "Cantina", value: cantina.name },
        { trait_type: "Vitigno", value: body.grape || "" },
        { trait_type: "Regione", value: body.region || "" },
        { trait_type: "Numero Bottiglia", value: body.bottleNumber },
        { trait_type: "Annata", value: body.vintage || "" },
      ],
    };
    const tokenUri = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString("base64")}`;

    let txHash: string | undefined;
    let tokenId: number | null = null;

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
          vintage: body.vintage ?? 0,
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
        collectionId: collection.id,
        cantinaId: cantina.id,
        ownerId: session.user.id,
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        imageGallery: body.imageGallery ?? [body.imageUrl],
        metadataUri: tokenUri,
        price: isFractionable ? null : (body.price ?? null),
        bottleNumber: body.bottleNumber,
        vintage: body.vintage,
        bottleFormat: body.bottleFormat ?? null,
        bottleStory: body.bottleStory ?? null,
        currentLocation: body.currentLocation ?? null,
        isFractionable,
        totalValue: isFractionable && body.totalValue ? body.totalValue : null,
        availableValue: isFractionable && body.totalValue ? body.totalValue : null,
        denominationId: body.denominationId ?? null,
        isListed: isFractionable ? true : !!body.price,
        status: isFractionable ? "LISTED" : (body.price ? "LISTED" : "MINTED"),
      },
    });

    await db.collection.update({
      where: { id: collection.id },
      data: { minted: 1 },
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

    return NextResponse.json({ success: true, tokenId, txHash, nftId: nft.id, onChain: !!txHash });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Errore nel minting" }, { status: 500 });
  }
}
