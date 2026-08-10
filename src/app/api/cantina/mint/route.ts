export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";

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
  royaltyPct: z.number().min(1).max(10).default(5),
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

    // La polizza All Risks è un obbligo contrattuale (art. A.3) e uno dei tre
    // impegni comunicati pubblicamente ai collezionisti: senza documento
    // caricato non si emettono certificati, altrimenti si venderebbe un bene
    // dichiarato assicurato senza che l'assicurazione risulti alla piattaforma.
    if (cantina && !cantina.insuranceDocUrl) {
      return NextResponse.json(
        {
          error:
            "Per emettere certificati devi prima caricare la polizza assicurativa All Risks, come previsto dal contratto (art. A.3). La trovi in Impostazioni → Documenti.",
        },
        { status: 403 }
      );
    }

    if (!cantina || cantina.id !== body.cantinaId) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const config = await db.platformConfig.findFirst();
    const mintFeePct = config?.mintFeePct ?? 5.0;

    // Determine bottle value for mint fee calculation
    const bottleValue = body.isFractionable ? (body.totalValue ?? 0) : (body.price ?? 0);
    if (bottleValue <= 0) {
      return NextResponse.json({ error: "Inserisci il prezzo della bottiglia per calcolare la fee di emissione" }, { status: 400 });
    }

    const mintFeeCents = Math.round(bottleValue * mintFeePct / 100 * 100);
    if (mintFeeCents < 50) {
      return NextResponse.json({ error: "Il valore della bottiglia è troppo basso (fee minima: €0.50)" }, { status: 400 });
    }

    // Auto-create a singleton collection
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

    // Create NFT as PENDING_PAYMENT — activated by Stripe webhook after mint fee is paid
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
        imageGallery: gallery,
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
        royaltyPct: body.royaltyPct,
        isListed: false,
        status: "PENDING_PAYMENT",
        mintFeePaid: false,
      },
    });

    await db.collection.update({ where: { id: collection.id }, data: { minted: 1 } });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    // Create Stripe Checkout for the mint fee (charged to cantina)
    const stripeSession = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: mintFeeCents,
            product_data: {
              name: `Fee di emissione — ${body.name}`,
              description: `${mintFeePct}% del valore bottiglia (€${bottleValue.toFixed(2)}). Royalty collezionisti: ${body.royaltyPct}%`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "mint_fee",
        nftId: nft.id,
        cantinaId: cantina.id,
        mintFeePct: mintFeePct.toString(),
        mintFeeCents: mintFeeCents.toString(),
        bottleValue: bottleValue.toString(),
        hasPrice: (!!body.price).toString(),
        isFractionable: isFractionable.toString(),
      },
      success_url: `${appUrl}/it/cantina/nfts?mint=success`,
      cancel_url: `${appUrl}/it/cantina/nfts?mint=cancelled&nftId=${nft.id}`,
    });

    // Store the Stripe session ID on the NFT
    await db.nft.update({
      where: { id: nft.id },
      data: { mintFeeStripeId: stripeSession.id },
    });

    return NextResponse.json({ checkoutUrl: stripeSession.url, nftId: nft.id });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Errore nel minting" }, { status: 500 });
  }
}
