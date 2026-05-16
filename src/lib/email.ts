import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    // Allow placeholder keys — emails will just fail silently in dev
    _resend = new Resend(key || "re_placeholder");
  }
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "Wine Bank 24 <noreply@winebank24.com>";
const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://winebank24.vercel.app";

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/api/auth/verify-email?token=${token}`;
  try {
    await getResend().emails.send({
      from: FROM,
      to: email,
      subject: "Verifica la tua email — Wine Bank 24",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#1c1917">Benvenuto su Wine Bank 24</h2>
          <p>Clicca il pulsante qui sotto per verificare il tuo indirizzo email e attivare il tuo account:</p>
          <a href="${url}" style="display:inline-block;background:#f59e0b;color:#1c1917;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">
            Verifica email
          </a>
          <p style="color:#78716c;font-size:13px">Il link scade tra 24 ore. Se non hai creato un account, ignora questa email.</p>
          <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0"/>
          <p style="color:#a8a29e;font-size:12px">Wine Bank 24 — Piattaforma di collezionismo digitale per vini pregiati italiani</p>
        </div>
      `,
    });
  } catch {
    // Silently fail in dev — log in production
    console.error("[email] Failed to send verification email to", email);
  }
}

export async function sendPurchaseEmail(to: string, nftName: string, price: number) {
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: `Acquisto completato: ${nftName}`,
      html: `
        <h2>Acquisto confermato!</h2>
        <p>Hai acquistato <strong>${nftName}</strong> per <strong>€ ${price.toFixed(2)}</strong>.</p>
        <p>Puoi trovarlo nella tua <a href="${APP_URL}/collector/portfolio">collezione personale</a>.</p>
      `,
    });
  } catch {
    console.error("[email] Failed to send purchase email to", to);
  }
}

export async function sendSaleEmail(to: string, nftName: string, amount: number) {
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: `Cessione completata: ${nftName}`,
      html: `
        <h2>Il tuo certificato è stato ceduto!</h2>
        <p><strong>${nftName}</strong> è stato acquisito da un altro collezionista per <strong>€ ${amount.toFixed(2)}</strong>.</p>
        <p>Controlla il tuo <a href="${APP_URL}/cantina/reports">report cessioni</a>.</p>
      `,
    });
  } catch {
    console.error("[email] Failed to send sale email to", to);
  }
}

export async function sendBurnRequestEmail(adminEmail: string, nftName: string, address: string) {
  try {
    await getResend().emails.send({
      from: FROM,
      to: adminEmail,
      subject: `Richiesta bottiglia fisica: ${nftName}`,
      html: `
        <h2>Nuova richiesta di consegna bottiglia</h2>
        <p>NFT: <strong>${nftName}</strong></p>
        <p>Indirizzo di spedizione: <strong>${address}</strong></p>
        <p>Accedi al <a href="${APP_URL}/admin/nfts">pannello admin</a> per processare la richiesta.</p>
      `,
    });
  } catch {
    console.error("[email] Failed to send burn request email");
  }
}
