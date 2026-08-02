import { db } from "@/lib/db";

/**
 * Diritto alla cancellazione (GDPR art. 17).
 *
 * Non eliminiamo la riga utente: le transazioni vanno conservate dieci anni
 * per obbligo fiscale (art. 2220 c.c. e normativa IVA) e la cancellazione
 * spezzerebbe la tracciabilità contabile. Applichiamo invece
 * l'anonimizzazione: ogni dato personale viene rimosso in modo irreversibile,
 * resta solo uno scheletro contabile non riconducibile a una persona.
 */

export interface DeletionBlocker {
  code: string;
  message: string;
}

/** Verifica cosa impedisce la cancellazione immediata */
export async function getDeletionBlockers(userId: string): Promise<DeletionBlocker[]> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });

  const [nftCount, fractionCount, pendingOffers, cantina, pendingBurn] = await Promise.all([
    db.nft.count({ where: { ownerId: userId, status: { notIn: ["BURNED"] } } }),
    db.nftFraction.count({ where: { ownerId: userId } }),
    db.offer.count({
      where: { status: { in: ["PENDING", "ACCEPTED"] }, OR: [{ buyerId: userId }, { sellerId: userId }] },
    }),
    db.cantina.findUnique({ where: { userId }, select: { id: true } }),
    db.burnRequest.count({ where: { requestedBy: userId, approved: false } }),
  ]);

  const blockers: DeletionBlocker[] = [];

  // Un amministratore che si cancella lascerebbe la piattaforma senza gestione:
  // il ruolo va prima trasferito a un altro account
  if (user?.role === "ADMIN") {
    blockers.push({
      code: "ADMIN",
      message:
        "Gli account amministratore non possono essere cancellati dal pannello: assegna prima il ruolo di amministratore a un altro utente.",
    });
  }

  if (cantina) {
    blockers.push({
      code: "CANTINA",
      message:
        "Il tuo è un account cantina con obblighi contrattuali verso i collezionisti. Scrivi a info@winebank24.eu: la cancellazione va gestita insieme dopo la chiusura delle posizioni aperte.",
    });
  }
  if (nftCount > 0) {
    blockers.push({
      code: "NFT_OWNED",
      message: `Possiedi ancora ${nftCount} certificat${nftCount === 1 ? "o" : "i"}. Vendili o richiedi il ritiro delle bottiglie prima di cancellare l'account: dopo la cancellazione non potresti più rivendicarli.`,
    });
  }
  if (fractionCount > 0) {
    blockers.push({
      code: "FRACTIONS_OWNED",
      message: `Possiedi ancora ${fractionCount} quot${fractionCount === 1 ? "a" : "e"} di co-proprietà. Cedile prima di procedere.`,
    });
  }
  if (pendingOffers > 0) {
    blockers.push({
      code: "PENDING_OFFERS",
      message: `Hai ${pendingOffers} offert${pendingOffers === 1 ? "a" : "e"} ancora aperte. Ritirale o completale prima di procedere.`,
    });
  }
  if (pendingBurn > 0) {
    blockers.push({
      code: "PENDING_DELIVERY",
      message: "Hai una richiesta di ritiro bottiglia in corso. Attendi la consegna prima di cancellare l'account.",
    });
  }

  return blockers;
}

/**
 * Esegue l'anonimizzazione. Irreversibile.
 * Ritorna il numero di record personali eliminati, per la ricevuta all'utente.
 */
export async function anonymizeAccount(userId: string) {
  // Segnaposto univoco: nessun dato reale, ma l'email resta unica in tabella
  const placeholder = `cancellato-${userId.slice(-8)}@anonimo.invalid`;

  const [notifications, favorites, wishlist, activities] = await db.$transaction([
    // Dati personali senza obbligo di conservazione: eliminati
    db.notification.deleteMany({ where: { userId } }),
    db.favoriteNft.deleteMany({ where: { userId } }),
    db.wishlistItem.deleteMany({ where: { userId } }),
    db.activityLog.deleteMany({ where: { userId } }),
    db.notificationPreference.deleteMany({ where: { userId } }),
    // Sessioni e collegamenti social: revocati (l'accesso diventa impossibile)
    db.session.deleteMany({ where: { userId } }),
    db.account.deleteMany({ where: { userId } }),
    // Indirizzi di spedizione nelle richieste di ritiro già evase
    db.burnRequest.updateMany({
      where: { requestedBy: userId },
      data: { address: "[dato rimosso su richiesta dell'utente]", notes: null },
    }),
    // Anagrafica: azzerata
    db.user.update({
      where: { id: userId },
      data: {
        email: placeholder,
        name: "Utente cancellato",
        firstName: null,
        lastName: null,
        birthDate: null,
        country: null,
        fiscalCode: null,      // libera il codice fiscale dal vincolo di unicità
        documentUrl: null,
        kycVerifiedAt: null,
        image: null,
        avatarUrl: null,
        username: null,
        password: null,         // nessun accesso possibile
        emailVerifyToken: null,
        emailVerifyExpiry: null,
        passwordResetToken: null,
        passwordResetExpiry: null,
        twoFactorSecret: null,
        twoFactorEnabled: false,
        isBlocked: true,
        deletedAt: new Date(),
      },
    }),
  ]);

  return {
    notifications: notifications.count,
    favorites: favorites.count,
    wishlist: wishlist.count,
    activities: activities.count,
  };
}
