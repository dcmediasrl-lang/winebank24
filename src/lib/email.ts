const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const FROM_EMAIL = "dcmediasrl@gmail.com";
const FROM_NAME = "Wine Bank 24";
const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://app.winebank24.eu";

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error ${res.status}: ${err}`);
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/api/auth/verify-email?token=${token}`;
  try {
    await sendEmail(
      email,
      "Verifica la tua email — Wine Bank 24",
      `
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
      `
    );
  } catch (err) {
    console.error("[email] Failed to send verification email to", email, err);
  }
}

export async function sendPurchaseEmail(to: string, nftName: string, price: number) {
  try {
    await sendEmail(
      to,
      `Acquisto completato: ${nftName}`,
      `
      <h2>Acquisto confermato!</h2>
      <p>Hai acquistato <strong>${nftName}</strong> per <strong>€ ${price.toFixed(2)}</strong>.</p>
      <p>Puoi trovarlo nella tua <a href="${APP_URL}/collector/portfolio">collezione personale</a>.</p>
      `
    );
  } catch (err) {
    console.error("[email] Failed to send purchase email to", to, err);
  }
}

export async function sendSaleEmail(to: string, nftName: string, amount: number) {
  try {
    await sendEmail(
      to,
      `Cessione completata: ${nftName}`,
      `
      <h2>Il tuo certificato è stato ceduto!</h2>
      <p><strong>${nftName}</strong> è stato acquisito da un altro collezionista per <strong>€ ${amount.toFixed(2)}</strong>.</p>
      <p>Controlla il tuo <a href="${APP_URL}/cantina/reports">report cessioni</a>.</p>
      `
    );
  } catch (err) {
    console.error("[email] Failed to send sale email to", to, err);
  }
}

export async function sendBurnRequestEmail(adminEmail: string, nftName: string, address: string) {
  try {
    await sendEmail(
      adminEmail,
      `Richiesta bottiglia fisica: ${nftName}`,
      `
      <h2>Nuova richiesta di consegna bottiglia</h2>
      <p>NFT: <strong>${nftName}</strong></p>
      <p>Indirizzo di spedizione: <strong>${address}</strong></p>
      <p>Accedi al <a href="${APP_URL}/admin/nfts">pannello admin</a> per processare la richiesta.</p>
      `
    );
  } catch (err) {
    console.error("[email] Failed to send burn request email", err);
  }
}
