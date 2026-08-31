import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Il trasferimento di proprietà è il punto più delicato della piattaforma: un
 * bug qui significa soldi incassati senza che il bene cambi proprietario, o il
 * contrario. Questi test non toccano un database reale — usano un Prisma
 * finto in memoria che riproduce solo le operazioni che offer-transfer.ts usa
 * davvero (findUnique, findFirst, update, updateMany, create, $transaction),
 * comprese le espressioni Prisma come { increment: 1 }.
 */

type Row = Record<string, unknown> & { id: string };

let tables: {
  nft: Record<string, Row>;
  nftFraction: Record<string, Row>;
  offer: Record<string, Row>;
  transaction: Record<string, Row>;
};

let idCounter = 0;
function nextId(prefix: string) {
  return `${prefix}-${++idCounter}`;
}

function resolveData(row: Row | undefined, data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && "increment" in (value as object)) {
      const current = Number(row?.[key] ?? 0);
      out[key] = current + Number((value as { increment: number }).increment);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function matchesWhere(row: Row, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, cond]) => {
    if (cond && typeof cond === "object" && "not" in (cond as object)) {
      return row[key] !== (cond as { not: unknown }).not;
    }
    return row[key] === cond;
  });
}

function makeModel(tableName: keyof typeof tables, idPrefix: string) {
  return {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => tables[tableName][where.id] ?? null),
    findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
      Object.values(tables[tableName]).find((row) => matchesWhere(row, where)) ?? null
    ),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const row = tables[tableName][where.id];
      const updated = { ...row, ...resolveData(row, data) } as Row;
      tables[tableName][where.id] = updated;
      return updated;
    }),
    updateMany: vi.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
      let count = 0;
      for (const row of Object.values(tables[tableName])) {
        if (matchesWhere(row, where)) {
          Object.assign(row, resolveData(row, data));
          count++;
        }
      }
      return { count };
    }),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      const id = nextId(idPrefix);
      const row = { id, ...data } as Row;
      tables[tableName][id] = row;
      return row;
    }),
  };
}

vi.mock("@/lib/db", () => {
  const db = {
    get offer() {
      const base = makeModel("offer", "offer");
      return {
        ...base,
        // offer.findUnique nel codice reale usa include: { nft, fraction } —
        // qui si allegano manualmente le relazioni dalle altre tabelle finte
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          const offer = tables.offer[where.id];
          if (!offer) return null;
          return {
            ...offer,
            nft: offer.nftId ? tables.nft[offer.nftId as string] ?? null : null,
            fraction: offer.fractionId ? tables.nftFraction[offer.fractionId as string] ?? null : null,
          };
        }),
      };
    },
    get nft() { return makeModel("nft", "nft"); },
    get nftFraction() { return makeModel("nftFraction", "fraction"); },
    get transaction() { return makeModel("transaction", "txn"); },
    $transaction: vi.fn(async (callback: (tx: typeof db) => Promise<unknown>) => callback(db)),
  };
  return { db };
});

vi.mock("@/lib/certificate", () => ({
  issueCertificate: vi.fn(async () => {}),
  issueFractionCertificate: vi.fn(async () => {}),
}));

import { executeOfferTransfer, executeFractionResaleTransfer } from "./offer-transfer";
import { issueCertificate, issueFractionCertificate } from "./certificate";

beforeEach(() => {
  tables = { nft: {}, nftFraction: {}, offer: {}, transaction: {} };
  idCounter = 0;
  vi.clearAllMocks();
});

describe("executeOfferTransfer — NFT intero", () => {
  function setupWholeNftOffer() {
    tables.nft["nft-1"] = {
      id: "nft-1", ownerId: "seller-1", isFractionable: false,
      isListed: true, status: "LISTED", price: 100,
    };
    tables.offer["offer-1"] = {
      id: "offer-1", nftId: "nft-1", fractionId: null,
      buyerId: "buyer-1", sellerId: "seller-1", amount: 100, status: "ACCEPTED",
    };
  }

  it("trasferisce la proprietà solo se l'offerta è ACCETTATA", async () => {
    tables.offer["offer-1"] = { id: "offer-1", status: "PENDING" } as Row;
    const result = await executeOfferTransfer({ offerId: "offer-1", stripeId: "stripe-1", platformFee: 5 });
    expect(result).toBe(false);
    expect(tables.nft["nft-1"]).toBeUndefined();
  });

  it("cambia il proprietario, incrementa la versione del certificato e crea la transazione", async () => {
    setupWholeNftOffer();
    const result = await executeOfferTransfer({ offerId: "offer-1", stripeId: "stripe-1", platformFee: 5 });

    expect(result).toBe(true);
    expect(tables.nft["nft-1"].ownerId).toBe("buyer-1");
    expect(tables.nft["nft-1"].status).toBe("SOLD");
    expect(tables.nft["nft-1"].isListed).toBe(false);
    expect(tables.nft["nft-1"].certificateVersion).toBe(1); // 0 + increment
    expect(tables.offer["offer-1"].status).toBe("COMPLETED");
  });

  it("blocca la vendita se il venditore non possiede più il certificato (anti doppia-vendita)", async () => {
    setupWholeNftOffer();
    tables.nft["nft-1"].ownerId = "qualcun-altro"; // il bene è già stato ceduto nel frattempo

    await expect(
      executeOfferTransfer({ offerId: "offer-1", stripeId: "stripe-1", platformFee: 5 })
    ).rejects.toThrow("Il venditore non possiede più questo certificato");

    // Nessuna modifica deve essere rimasta a metà
    expect(tables.nft["nft-1"].ownerId).toBe("qualcun-altro");
    expect(tables.offer["offer-1"].status).toBe("ACCEPTED");
  });

  it("rifiuta automaticamente le altre offerte pendenti sullo stesso NFT", async () => {
    setupWholeNftOffer();
    tables.offer["offer-2"] = {
      id: "offer-2", nftId: "nft-1", buyerId: "buyer-2", sellerId: "seller-1",
      amount: 90, status: "PENDING",
    };

    await executeOfferTransfer({ offerId: "offer-1", stripeId: "stripe-1", platformFee: 5 });

    expect(tables.offer["offer-2"].status).toBe("REJECTED");
  });

  it("emette il certificato per l'acquirente dopo il trasferimento", async () => {
    setupWholeNftOffer();
    await executeOfferTransfer({ offerId: "offer-1", stripeId: "stripe-1", platformFee: 5 });

    expect(issueCertificate).toHaveBeenCalledWith(
      expect.objectContaining({ nftId: "nft-1", ownerId: "buyer-1" })
    );
    expect(issueFractionCertificate).not.toHaveBeenCalled();
  });
});

describe("executeOfferTransfer — NFT frazionabile (acquisto dal pool)", () => {
  it("crea una nuova quota per l'acquirente e riduce il valore disponibile", async () => {
    tables.nft["nft-2"] = {
      id: "nft-2", ownerId: "cantina-1", isFractionable: true,
      status: "LISTED", totalValue: 1000, availableValue: 600,
    };
    tables.offer["offer-3"] = {
      id: "offer-3", nftId: "nft-2", fractionId: null,
      buyerId: "buyer-1", sellerId: "cantina-1", amount: 200, status: "ACCEPTED",
    };

    await executeOfferTransfer({ offerId: "offer-3", stripeId: "stripe-3", platformFee: 10 });

    expect(tables.nft["nft-2"].availableValue).toBe(400);
    const fraction = Object.values(tables.nftFraction)[0];
    expect(fraction.ownerId).toBe("buyer-1");
    expect(fraction.percentage).toBe(20); // 200 / 1000 * 100
    expect(issueFractionCertificate).toHaveBeenCalledWith(
      expect.objectContaining({ fractionId: fraction.id })
    );
    expect(issueCertificate).not.toHaveBeenCalled();
  });

  it("segnala l'errore se l'importo supera il valore ancora disponibile", async () => {
    tables.nft["nft-2"] = {
      id: "nft-2", ownerId: "cantina-1", isFractionable: true,
      status: "LISTED", totalValue: 1000, availableValue: 100,
    };
    tables.offer["offer-3"] = {
      id: "offer-3", nftId: "nft-2", buyerId: "buyer-1", sellerId: "cantina-1",
      amount: 200, status: "ACCEPTED",
    };

    await expect(
      executeOfferTransfer({ offerId: "offer-3", stripeId: "stripe-3", platformFee: 10 })
    ).rejects.toThrow("Valore non più disponibile per questo importo");
  });
});

describe("executeOfferTransfer — cessione di una quota esistente", () => {
  it("cessione totale: la stessa riga cambia proprietario", async () => {
    tables.nftFraction["fraction-1"] = {
      id: "fraction-1", nftId: "nft-3", ownerId: "seller-1",
      percentage: 30, investedAmount: 300, isListed: true, listedPercentage: null,
      certificateVersion: 0,
    };
    tables.offer["offer-4"] = {
      id: "offer-4", fractionId: "fraction-1", nftId: null,
      buyerId: "buyer-1", sellerId: "seller-1", amount: 350, status: "ACCEPTED",
    };

    await executeOfferTransfer({ offerId: "offer-4", stripeId: "stripe-4", platformFee: 5 });

    expect(tables.nftFraction["fraction-1"].ownerId).toBe("buyer-1");
    expect(tables.nftFraction["fraction-1"].percentage).toBe(30); // invariata
    expect(tables.nftFraction["fraction-1"].certificateVersion).toBe(1);
    // Cessione totale: un solo certificato, per l'acquirente
    expect(issueFractionCertificate).toHaveBeenCalledTimes(1);
    expect(issueFractionCertificate).toHaveBeenCalledWith(
      expect.objectContaining({ fractionId: "fraction-1" })
    );
  });

  it("cessione parziale: riemette il certificato sia al venditore (quota residua) sia all'acquirente", async () => {
    tables.nftFraction["fraction-2"] = {
      id: "fraction-2", nftId: "nft-3", ownerId: "seller-1",
      percentage: 50, investedAmount: 500, isListed: true, listedPercentage: 20,
      certificateVersion: 0,
    };
    tables.offer["offer-5"] = {
      id: "offer-5", fractionId: "fraction-2", nftId: null,
      buyerId: "buyer-1", sellerId: "seller-1", amount: 220, status: "ACCEPTED",
    };

    await executeOfferTransfer({ offerId: "offer-5", stripeId: "stripe-5", platformFee: 5 });

    // Il venditore mantiene il 30% residuo
    expect(tables.nftFraction["fraction-2"].percentage).toBe(30);
    expect(tables.nftFraction["fraction-2"].ownerId).toBe("seller-1");

    // L'acquirente riceve una nuova riga con il 20% ceduto
    const buyerFraction = Object.values(tables.nftFraction).find((f) => f.id !== "fraction-2");
    expect(buyerFraction?.ownerId).toBe("buyer-1");
    expect(buyerFraction?.percentage).toBe(20);

    expect(issueFractionCertificate).toHaveBeenCalledTimes(2);
  });

  it("blocca la cessione se il venditore non possiede più la quota", async () => {
    tables.nftFraction["fraction-3"] = {
      id: "fraction-3", nftId: "nft-3", ownerId: "qualcun-altro",
      percentage: 10, investedAmount: 100, isListed: true, listedPercentage: null,
    };
    tables.offer["offer-6"] = {
      id: "offer-6", fractionId: "fraction-3", buyerId: "buyer-1",
      sellerId: "seller-1", amount: 120, status: "ACCEPTED",
    };

    await expect(
      executeOfferTransfer({ offerId: "offer-6", stripeId: "stripe-6", platformFee: 5 })
    ).rejects.toThrow("Il venditore non possiede più questa quota");
  });
});

describe("executeFractionResaleTransfer — vendita diretta di una quota (senza offerta)", () => {
  it("non fa nulla se la quota non è più in vendita", async () => {
    tables.nftFraction["fraction-7"] = {
      id: "fraction-7", nftId: "nft-4", ownerId: "seller-1",
      percentage: 15, investedAmount: 150, isListed: false,
    };
    const result = await executeFractionResaleTransfer({
      fractionId: "fraction-7", buyerId: "buyer-1", stripeId: "stripe-7", platformFee: 2,
    });
    expect(result).toBe(false);
  });

  it("non permette di acquistare la propria stessa quota", async () => {
    tables.nftFraction["fraction-8"] = {
      id: "fraction-8", nftId: "nft-4", ownerId: "seller-1",
      percentage: 15, investedAmount: 150, isListed: true, askingPrice: 160,
    };
    const result = await executeFractionResaleTransfer({
      fractionId: "fraction-8", buyerId: "seller-1", stripeId: "stripe-8", platformFee: 2,
    });
    expect(result).toBe(false);
  });

  it("trasferisce la quota intera e la segna come non più in vendita", async () => {
    tables.nftFraction["fraction-9"] = {
      id: "fraction-9", nftId: "nft-4", ownerId: "seller-1",
      percentage: 15, investedAmount: 150, isListed: true, askingPrice: 160,
      listedPercentage: null, certificateVersion: 0,
    };

    const result = await executeFractionResaleTransfer({
      fractionId: "fraction-9", buyerId: "buyer-1", stripeId: "stripe-9", platformFee: 2,
    });

    expect(result).toBe(true);
    expect(tables.nftFraction["fraction-9"].ownerId).toBe("buyer-1");
    expect(tables.nftFraction["fraction-9"].isListed).toBe(false);
    expect(tables.nftFraction["fraction-9"].certificateVersion).toBe(1);
  });
});
