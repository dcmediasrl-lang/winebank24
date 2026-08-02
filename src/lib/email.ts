const BREVO_API_KEY = process.env.BREVO_API_KEY!;
const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@winebank24.eu";
const FROM_NAME = "Wine Bank 24";
const APP_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://app.winebank24.eu";

type Attachment = { name: string; content: string }; // base64 content

// ── Layout email brandizzato Wine Bank 24 ────────────────────────────────────
// Header scuro con logo testuale (le email non rendono l'SVG in modo affidabile),
// corpo bianco, pulsante opzionale, footer con disclaimer. Testato su client
// desktop/mobile: tabelle inline, nessun CSS esterno.
export function emailLayout(opts: {
  heading: string;
  intro: string;
  bodyHtml?: string;
  cta?: { label: string; url: string };
  footerNote?: string;
}): string {
  const { heading, intro, bodyHtml = "", cta, footerNote } = opts;
  const button = cta
    ? `<tr><td style="padding:8px 0 4px">
         <a href="${cta.url}" style="display:inline-block;background:#A21C19;color:#ffffff;font-weight:700;font-size:15px;padding:13px 30px;border-radius:10px;text-decoration:none">${cta.label}</a>
       </td></tr>`
    : "";
  return `
  <div style="background:#f5f2f2;padding:24px 12px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
      <tr>
        <td style="background:#13110C;padding:22px 32px">
          <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.3px">Wine<span style="color:#e97770">Bank</span> 24</span>
          <span style="font-size:18px;margin-left:2px">🍷</span>
        </td>
      </tr>
      <tr>
        <td style="padding:32px">
          <h1 style="margin:0 0 12px;font-size:21px;color:#13110C;font-weight:800">${heading}</h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4b4642">${intro}</p>
          <table role="presentation" cellpadding="0" cellspacing="0">${bodyHtml}${button}</table>
          ${footerNote ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#a8a29e">${footerNote}</p>` : ""}
        </td>
      </tr>
      <tr>
        <td style="background:#faf7f7;border-top:1px solid #eee;padding:20px 32px">
          <p style="margin:0 0 6px;font-size:11px;line-height:1.5;color:#9c9490">
            ⚠️ Wine Bank 24 è una piattaforma di collezionismo. I certificati digitali (NFT) non costituiscono strumenti finanziari ai sensi della Direttiva MiFID II.
          </p>
          <p style="margin:0;font-size:11px;color:#c4bcb8">app.winebank24.eu · © ${new Date().getFullYear()} Wine Bank 24</p>
        </td>
      </tr>
    </table>
  </div>`;
}

function infoRow(label: string, value: string): string {
  return `<tr><td style="padding:6px 0;font-size:14px;color:#4b4642"><span style="color:#a8a29e">${label}:</span> <strong style="color:#13110C">${value}</strong></td></tr>`;
}

async function sendEmail(to: string, subject: string, html: string, attachments?: Attachment[]) {
  const body: Record<string, unknown> = {
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };
  if (attachments?.length) body.attachment = attachments;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[Brevo] ${res.status} sending to ${to}:`, err);
    throw new Error(`Brevo error ${res.status}: ${err}`);
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/api/auth/verify-email?token=${token}`;
  try {
    await sendEmail(
      email,
      "Verifica la tua email — Wine Bank 24",
      emailLayout({
        heading: "Benvenuto su Wine Bank 24",
        intro: "Conferma il tuo indirizzo email per attivare l'account e iniziare a collezionare vini pregiati certificati.",
        cta: { label: "Verifica email", url },
        footerNote: "Il link scade tra 24 ore. Se non hai creato un account, ignora questa email.",
      })
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
      emailLayout({
        heading: "Acquisto confermato! 🎉",
        intro: "Il certificato è ora nella tua collezione personale.",
        bodyHtml: infoRow("Certificato", nftName) + infoRow("Importo", `€ ${price.toFixed(2)}`),
        cta: { label: "Vai alla mia collezione", url: `${APP_URL}/it/collector/portfolio` },
      })
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
      emailLayout({
        heading: "Il tuo certificato è stato ceduto!",
        intro: "Un altro collezionista ha acquisito il tuo certificato.",
        bodyHtml: infoRow("Certificato", nftName) + infoRow("Importo ricevuto", `€ ${amount.toFixed(2)}`),
        cta: { label: "Vedi il report", url: `${APP_URL}/it/collector/reports` },
      })
    );
  } catch (err) {
    console.error("[email] Failed to send sale email to", to, err);
  }
}

export async function sendWelcomeCantinaEmail(to: string, contactName: string, cantinaName: string, password: string) {
  try {
    await sendEmail(
      to,
      `Benvenuto su Wine Bank 24 — Account Cantina attivato`,
      `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0d0705;padding:32px;border-radius:12px">
        <div style="text-align:center;margin-bottom:24px">
          <img src="${APP_URL}/logo.png" alt="Wine Bank 24" style="height:48px;width:auto;background:#fff;padding:6px 12px;border-radius:8px" />
        </div>
        <h2 style="color:#ffffff;font-size:22px;margin-bottom:8px">Benvenuto su Wine Bank 24, ${contactName}!</h2>
        <p style="color:#cccccc;font-size:15px;line-height:1.6">Il tuo account cantina <strong style="color:#ffffff">${cantinaName}</strong> è stato attivato dall'amministratore della piattaforma.</p>

        <div style="background:#1a0f0f;border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:20px;margin:24px 0">
          <p style="color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px">Le tue credenziali di accesso</p>
          <p style="color:#ffffff;margin:6px 0"><strong>Email:</strong> <span style="color:#f59e0b">${to}</span></p>
          <p style="color:#ffffff;margin:6px 0"><strong>Password temporanea:</strong> <span style="color:#f59e0b;font-family:monospace;font-size:16px">${password}</span></p>
        </div>

        <p style="color:#cccccc;font-size:14px;line-height:1.6">Ti consigliamo di cambiare la password al primo accesso dalle impostazioni del tuo profilo.</p>

        <div style="text-align:center;margin:28px 0">
          <a href="${APP_URL}/it/login" style="display:inline-block;background:linear-gradient(135deg,#993300,#df071b);color:#ffffff;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px">
            Accedi alla piattaforma →
          </a>
        </div>

        <p style="color:#cccccc;font-size:13px;line-height:1.6">Dalla tua area personale potrai:<br/>
          • Creare le tue collezioni di vini<br/>
          • Emettere certificati digitali NFT per le tue bottiglie<br/>
          • Ricevere offerte dai collezionisti<br/>
          • Consultare i report delle cessioni
        </p>

        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:28px 0"/>
        <p style="color:#666;font-size:12px;text-align:center">Wine Bank 24 — Piattaforma di collezionismo digitale per vini pregiati<br/>
          <a href="${APP_URL}" style="color:#993300">${APP_URL}</a>
        </p>
      </div>
      `
    );
  } catch (err) {
    console.error("[email] Failed to send welcome cantina email to", to, err);
  }
}

// Throws on failure so callers can decide how to handle the error
export async function sendContractEmail(to: string, cantinaName: string, pdfBytes: Uint8Array) {
  const base64 = Buffer.from(pdfBytes).toString("base64");
  await sendEmail(
    to,
    "Contratto Creator accettato — Wine Bank 24",
    `
    <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0d0705;padding:32px;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <img src="${APP_URL}/logo.png" alt="Wine Bank 24" style="height:48px;background:#fff;padding:6px 12px;border-radius:8px"/>
      </div>
      <h2 style="color:#ffffff;font-size:20px;margin-bottom:8px">Contratto Creator accettato</h2>
      <p style="color:#cccccc;font-size:15px;line-height:1.6">
        Grazie <strong style="color:#ffffff">${cantinaName}</strong>!<br/>
        Il tuo contratto Creator con Wine Bank 24 e stato registrato con successo.
      </p>
      <p style="color:#cccccc;font-size:14px;line-height:1.6">
        In allegato trovi il PDF del contratto. Conservalo per i tuoi archivi.
      </p>
      <div style="text-align:center;margin:28px 0">
        <a href="${APP_URL}/it/cantina" style="display:inline-block;background:linear-gradient(135deg,#993300,#df071b);color:#ffffff;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px">
          Vai alla tua area cantina
        </a>
      </div>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0"/>
      <p style="color:#666;font-size:12px;text-align:center">Wine Bank 24 — Piattaforma NFT per vini pregiati</p>
    </div>
    `,
    [{ name: "contratto-creator-winebank24.pdf", content: base64 }],
  );
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

export async function sendCantinaAccountSetupEmail(
  to: string,
  contactName: string,
  cantinaName: string,
  setupUrl: string,
) {
  try {
    await sendEmail(
      to,
      "Accesso al tuo account Wine Bank 24 — Imposta la password",
      `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#0d0705;padding:32px;border-radius:12px">
        <div style="text-align:center;margin-bottom:24px">
          <img src="${APP_URL}/logo.png" alt="Wine Bank 24" style="height:48px;width:auto;background:#fff;padding:6px 12px;border-radius:8px" />
        </div>
        <h2 style="color:#ffffff;font-size:22px;margin-bottom:8px">Ciao ${contactName},</h2>
        <p style="color:#cccccc;font-size:15px;line-height:1.6">
          Il tuo account cantina <strong style="color:#ffffff">${cantinaName}</strong> su Wine Bank 24 e pronto.
          Clicca il pulsante qui sotto per impostare la tua password e accedere alla piattaforma.
        </p>
        <div style="text-align:center;margin:28px 0">
          <a href="${setupUrl}" style="display:inline-block;background:linear-gradient(135deg,#993300,#df071b);color:#ffffff;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px">
            Imposta la tua password
          </a>
        </div>
        <p style="color:#999;font-size:13px;text-align:center">Il link e valido per 48 ore.</p>
        <p style="color:#cccccc;font-size:13px;line-height:1.6">
          Se non riesci a cliccare il pulsante, copia e incolla questo link nel browser:<br/>
          <span style="color:#f59e0b;word-break:break-all">${setupUrl}</span>
        </p>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:28px 0"/>
        <p style="color:#666;font-size:12px;text-align:center">
          Wine Bank 24 — Piattaforma NFT per vini pregiati<br/>
          <a href="${APP_URL}" style="color:#993300">${APP_URL}</a>
        </p>
      </div>
      `,
    );
  } catch (err) {
    console.error("[email] Failed to send cantina account setup email", err);
  }
}
