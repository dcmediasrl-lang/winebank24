import { db } from "@/lib/db";

export type NotificationType =
  | "OFFER_RECEIVED"
  | "OFFER_ACCEPTED"
  | "OFFER_REJECTED"
  | "NFT_SOLD"
  | "NFT_PURCHASED"
  | "NFT_MINTED"
  | "DELIVERY_REQUESTED";

// Mappa ogni tipo al gruppo di preferenze che lo governa
const CATEGORY: Record<NotificationType, "offers" | "sales" | "purchase"> = {
  OFFER_RECEIVED: "offers",
  OFFER_ACCEPTED: "offers",
  OFFER_REJECTED: "offers",
  NFT_SOLD: "sales",
  NFT_PURCHASED: "purchase",
  NFT_MINTED: "purchase",
  DELIVERY_REQUESTED: "sales",
};

/**
 * Crea una notifica in-app per l'utente, rispettando le sue preferenze.
 * Non lancia mai: un errore sulle notifiche non deve rompere il flusso principale.
 * Ritorna se il canale email è abilitato per questa categoria (così il chiamante
 * può decidere se inviare anche l'email).
 */
export async function notify(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}): Promise<{ emailEnabled: boolean }> {
  const { userId, type, title, body, link } = params;
  const category = CATEGORY[type];

  try {
    const pref = await db.notificationPreference.findUnique({ where: { userId } });

    const inAppOn = pref
      ? category === "offers" ? pref.inAppOffers
        : category === "sales" ? pref.inAppSales
        : pref.inAppPurchase
      : true; // default: tutto attivo

    const emailOn = pref
      ? category === "offers" ? pref.emailOffers
        : category === "sales" ? pref.emailSales
        : pref.emailPurchase
      : true;

    if (inAppOn) {
      await db.notification.create({
        data: { userId, type, title, body: body ?? null, link: link ?? null },
      });
    }

    return { emailEnabled: emailOn };
  } catch (err) {
    console.error("[notify]", err);
    return { emailEnabled: true };
  }
}

/** Preferenze effettive (con default se il record non esiste ancora) */
export async function getNotificationPreferences(userId: string) {
  const pref = await db.notificationPreference.findUnique({ where: { userId } });
  return {
    inAppOffers: pref?.inAppOffers ?? true,
    inAppSales: pref?.inAppSales ?? true,
    inAppPurchase: pref?.inAppPurchase ?? true,
    emailOffers: pref?.emailOffers ?? true,
    emailSales: pref?.emailSales ?? true,
    emailPurchase: pref?.emailPurchase ?? true,
  };
}
