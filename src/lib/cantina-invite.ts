import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { sendCantinaAccountSetupEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.winebank24.eu";
const SETUP_LINK_HOURS = 48;

/**
 * Genera il link di attivazione e lo invia alla cantina. Nessuna password
 * transita mai in un'email: prima la creazione dell'account mandava la
 * password vera e propria in chiaro nel corpo del messaggio (stesso rischio
 * di un'intercettazione o di restare per anni in una casella di posta), ora
 * si usa lo stesso meccanismo a token già in uso per il reset password.
 */
export async function sendCantinaInvite(params: {
  userId: string;
  email: string;
  contactName: string;
  cantinaName: string;
}): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + SETUP_LINK_HOURS * 60 * 60 * 1000);

  await db.user.update({
    where: { id: params.userId },
    data: { emailVerifyToken: token, emailVerifyExpiry: expiry },
  });

  const setupUrl = `${APP_URL}/it/imposta-password?token=${token}`;
  await sendCantinaAccountSetupEmail(params.email, params.contactName, params.cantinaName, setupUrl);
}
