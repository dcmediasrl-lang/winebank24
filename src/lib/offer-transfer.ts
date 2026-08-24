import { db } from "@/lib/db";
import { issueCertificate, issueFractionCertificate } from "@/lib/certificate";

interface FractionCertTargets {
  buyerFractionId: string;
  sellerFractionId?: string;
}

/**
 * Esegue il trasferimento di proprietà per un'offerta ACCETTATA e PAGATA.
 * Chiamata esclusivamente dal webhook Stripe dopo checkout.session.completed.
 * Ritorna false se l'offerta non è più nello stato giusto (già processata).
 */
export async function executeOfferTransfer(params: {
  offerId: string;
  stripeId: string;
  platformFee: number;
}): Promise<boolean> {
  const { offerId, stripeId, platformFee } = params;

  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: { nft: true, fraction: true },
  });
  if (!offer || offer.status !== "ACCEPTED") return false;

  // Il valore di ritorno della transazione (non una variabile catturata dalla
  // closure) indica quale certificato emettere dopo il commit: o quello di un
  // NFT intero, o quello di una/due quote coinvolte nella cessione
  const transferResult = await db.$transaction(async (tx) => {
    let wholeNft: { nftId: string; buyerId: string; transactionId: string } | null = null;
    let fractions: FractionCertTargets | null = null;
    let transactionId: string | undefined;

    if (offer.nftId && offer.nft) {
      const nft = offer.nft;

      if (nft.isFractionable) {
        // ── NFT frazionabile: crea/accresce la quota dell'acquirente ────────
        const totalValue = Number(nft.totalValue ?? 0);
        const availableValue = Number(nft.availableValue ?? 0);

        if (offer.amount > availableValue) {
          throw new Error("Valore non più disponibile per questo importo");
        }

        const pct = totalValue > 0 ? (offer.amount / totalValue) * 100 : 0;
        const newAvailable = availableValue - offer.amount;

        await tx.nft.update({
          where: { id: nft.id },
          data: {
            availableValue: newAvailable,
            status: newAvailable <= 0 ? "SOLD" : nft.status,
          },
        });

        const existing = await tx.nftFraction.findFirst({
          where: { nftId: nft.id, ownerId: offer.buyerId },
        });
        let buyerFractionId: string;
        if (existing) {
          const updated = await tx.nftFraction.update({
            where: { id: existing.id },
            data: {
              percentage: Number(existing.percentage) + pct,
              investedAmount: Number(existing.investedAmount) + offer.amount,
              certificateVersion: { increment: 1 },
            },
          });
          buyerFractionId = updated.id;
        } else {
          const created = await tx.nftFraction.create({
            data: {
              nftId: nft.id,
              ownerId: offer.buyerId,
              percentage: pct,
              investedAmount: offer.amount,
            },
          });
          buyerFractionId = created.id;
        }
        fractions = { buyerFractionId };
      } else {
        // ── NFT intero: verifica che il venditore sia ancora proprietario ───
        if (nft.ownerId !== offer.sellerId) {
          throw new Error("Il venditore non possiede più questo certificato");
        }
        await tx.nft.update({
          where: { id: offer.nftId },
          data: {
            ownerId: offer.buyerId,
            isListed: false,
            status: "SOLD",
            price: null,
            certificateVersion: { increment: 1 },
          },
        });

        // Rifiuta le altre offerte pendenti su questo NFT
        await tx.offer.updateMany({
          where: { nftId: offer.nftId, status: "PENDING", id: { not: offerId } },
          data: { status: "REJECTED" },
        });
      }

      const createdTransaction = await tx.transaction.create({
        data: {
          nftId: offer.nftId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          type: "BUY",
          amount: offer.amount,
          platformFee,
          paymentMethod: "FIAT",
          stripeId,
        },
      });

      if (!nft.isFractionable) {
        wholeNft = { nftId: offer.nftId, buyerId: offer.buyerId, transactionId: createdTransaction.id };
      } else {
        transactionId = createdTransaction.id;
      }
    } else if (offer.fractionId && offer.fraction) {
      // ── Quota di co-proprietà (liquidazione tra collezionisti) ────────────
      const fraction = offer.fraction;
      if (fraction.ownerId !== offer.sellerId) {
        throw new Error("Il venditore non possiede più questa quota");
      }
      const totalPct = Number(fraction.percentage);
      const listedPct = fraction.listedPercentage !== null
        ? Number(fraction.listedPercentage)
        : totalPct;
      const isPartialSale = listedPct < totalPct;
      const askingPrice = offer.amount;
      const soldInvestedAmount = isPartialSale
        ? Number(fraction.investedAmount) * (listedPct / totalPct)
        : Number(fraction.investedAmount);
      const remainingPct = totalPct - listedPct;
      const remainingInvestedAmount = Number(fraction.investedAmount) - soldInvestedAmount;

      let buyerFractionId: string;
      let sellerFractionId: string | undefined;

      if (isPartialSale) {
        const updatedSeller = await tx.nftFraction.update({
          where: { id: offer.fractionId },
          data: {
            percentage: remainingPct,
            investedAmount: remainingInvestedAmount,
            isListed: false,
            askingPrice: null,
            listedPercentage: null,
            certificateVersion: { increment: 1 },
          },
        });
        // Il venditore ha ancora una quota (parziale): il suo vecchio
        // certificato riportava una percentuale non più corretta, va riemesso
        sellerFractionId = updatedSeller.id;

        const existingBuyerFraction = await tx.nftFraction.findFirst({
          where: { nftId: fraction.nftId, ownerId: offer.buyerId },
        });
        if (existingBuyerFraction) {
          const updated = await tx.nftFraction.update({
            where: { id: existingBuyerFraction.id },
            data: {
              percentage: Number(existingBuyerFraction.percentage) + listedPct,
              investedAmount: Number(existingBuyerFraction.investedAmount) + askingPrice,
              certificateVersion: { increment: 1 },
            },
          });
          buyerFractionId = updated.id;
        } else {
          const created = await tx.nftFraction.create({
            data: {
              nftId: fraction.nftId,
              ownerId: offer.buyerId,
              percentage: listedPct,
              investedAmount: askingPrice,
              isListed: false,
            },
          });
          buyerFractionId = created.id;
        }
      } else {
        // Cessione totale della quota: stessa riga, cambia solo il proprietario
        const updated = await tx.nftFraction.update({
          where: { id: offer.fractionId },
          data: {
            ownerId: offer.buyerId,
            investedAmount: askingPrice,
            isListed: false,
            askingPrice: null,
            listedPercentage: null,
            certificateVersion: { increment: 1 },
          },
        });
        buyerFractionId = updated.id;
      }

      const createdTransaction = await tx.transaction.create({
        data: {
          nftId: fraction.nftId,
          buyerId: offer.buyerId,
          sellerId: offer.sellerId,
          type: "BUY",
          amount: offer.amount,
          platformFee,
          paymentMethod: "FIAT",
          stripeId,
        },
      });
      transactionId = createdTransaction.id;
      fractions = { buyerFractionId, sellerFractionId };

      await tx.offer.updateMany({
        where: { fractionId: offer.fractionId, status: "PENDING", id: { not: offerId } },
        data: { status: "REJECTED" },
      });
    }

    await tx.offer.update({ where: { id: offerId }, data: { status: "COMPLETED" } });
    return { wholeNft, fractions, transactionId };
  });

  if (transferResult.wholeNft) {
    await issueCertificate({
      nftId: transferResult.wholeNft.nftId,
      ownerId: transferResult.wholeNft.buyerId,
      transactionId: transferResult.wholeNft.transactionId,
    });
  } else if (transferResult.fractions) {
    // Il transactionId va solo sul certificato dell'acquirente: la stessa
    // transazione non può essere collegata a due certificati (vincolo @unique)
    await issueFractionCertificate({
      fractionId: transferResult.fractions.buyerFractionId,
      transactionId: transferResult.transactionId,
    });
    if (transferResult.fractions.sellerFractionId) {
      await issueFractionCertificate({ fractionId: transferResult.fractions.sellerFractionId });
    }
  }

  return true;
}

/**
 * Trasferimento di una quota in vendita diretta (senza offerta), dopo pagamento.
 * Chiamata esclusivamente dal webhook Stripe.
 */
export async function executeFractionResaleTransfer(params: {
  fractionId: string;
  buyerId: string;
  stripeId: string;
  platformFee: number;
}): Promise<boolean> {
  const { fractionId, buyerId, stripeId, platformFee } = params;

  const fraction = await db.nftFraction.findUnique({ where: { id: fractionId } });
  if (!fraction || !fraction.isListed) return false;
  if (fraction.ownerId === buyerId) return false;

  const sellerId = fraction.ownerId;
  const askingPrice = Number(fraction.askingPrice ?? fraction.investedAmount);
  const totalPct = Number(fraction.percentage);
  const listedPct = fraction.listedPercentage !== null
    ? Number(fraction.listedPercentage)
    : totalPct;
  const isPartialSale = listedPct < totalPct;
  const soldInvestedAmount = isPartialSale
    ? Number(fraction.investedAmount) * (listedPct / totalPct)
    : Number(fraction.investedAmount);
  const remainingPct = totalPct - listedPct;
  const remainingInvestedAmount = Number(fraction.investedAmount) - soldInvestedAmount;

  const { buyerFractionId, sellerFractionId, transactionId } = await db.$transaction(async (tx) => {
    let buyerFractionId: string;
    let sellerFractionId: string | undefined;

    if (isPartialSale) {
      const updatedSeller = await tx.nftFraction.update({
        where: { id: fractionId },
        data: {
          percentage: remainingPct,
          investedAmount: remainingInvestedAmount,
          isListed: false,
          askingPrice: null,
          listedPercentage: null,
          certificateVersion: { increment: 1 },
        },
      });
      sellerFractionId = updatedSeller.id;

      const existingBuyerFraction = await tx.nftFraction.findFirst({
        where: { nftId: fraction.nftId, ownerId: buyerId },
      });
      if (existingBuyerFraction) {
        const updated = await tx.nftFraction.update({
          where: { id: existingBuyerFraction.id },
          data: {
            percentage: Number(existingBuyerFraction.percentage) + listedPct,
            investedAmount: Number(existingBuyerFraction.investedAmount) + askingPrice,
            certificateVersion: { increment: 1 },
          },
        });
        buyerFractionId = updated.id;
      } else {
        const created = await tx.nftFraction.create({
          data: {
            nftId: fraction.nftId,
            ownerId: buyerId,
            percentage: listedPct,
            investedAmount: askingPrice,
            isListed: false,
          },
        });
        buyerFractionId = created.id;
      }
    } else {
      const updated = await tx.nftFraction.update({
        where: { id: fractionId },
        data: {
          ownerId: buyerId,
          investedAmount: askingPrice,
          isListed: false,
          askingPrice: null,
          listedPercentage: null,
          certificateVersion: { increment: 1 },
        },
      });
      buyerFractionId = updated.id;
    }

    const createdTransaction = await tx.transaction.create({
      data: {
        nftId: fraction.nftId,
        buyerId,
        sellerId,
        type: "BUY",
        amount: askingPrice,
        platformFee,
        paymentMethod: "FIAT",
        stripeId,
      },
    });

    // Rifiuta le offerte pendenti sulla quota venduta
    await tx.offer.updateMany({
      where: { fractionId, status: "PENDING" },
      data: { status: "REJECTED" },
    });

    return { buyerFractionId, sellerFractionId, transactionId: createdTransaction.id };
  });

  // Il transactionId va solo sul certificato dell'acquirente (vincolo @unique)
  await issueFractionCertificate({ fractionId: buyerFractionId, transactionId });
  if (sellerFractionId) {
    await issueFractionCertificate({ fractionId: sellerFractionId });
  }

  return true;
}
