import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "noreply@winebank24.com";

export async function sendPurchaseEmail(to: string, nftName: string, price: number) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Acquisto completato: ${nftName}`,
    html: `
      <h2>Acquisto confermato!</h2>
      <p>Hai acquistato <strong>${nftName}</strong> per <strong>€ ${price.toFixed(2)}</strong>.</p>
      <p>Puoi trovarlo nella tua <a href="${process.env.NEXT_PUBLIC_APP_URL}/collector/portfolio">vetrina personale</a>.</p>
    `,
  });
}

export async function sendSaleEmail(to: string, nftName: string, amount: number) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Vendita completata: ${nftName}`,
    html: `
      <h2>Il tuo NFT è stato venduto!</h2>
      <p><strong>${nftName}</strong> è stato acquistato per <strong>€ ${amount.toFixed(2)}</strong>.</p>
      <p>Controlla il tuo <a href="${process.env.NEXT_PUBLIC_APP_URL}/cantina/reports">report vendite</a>.</p>
    `,
  });
}

export async function sendBurnRequestEmail(adminEmail: string, nftName: string, address: string) {
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Richiesta bottiglia fisica: ${nftName}`,
    html: `
      <h2>Nuova richiesta di consegna bottiglia</h2>
      <p>NFT: <strong>${nftName}</strong></p>
      <p>Indirizzo di spedizione: <strong>${address}</strong></p>
      <p>Accedi al <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/nfts">pannello admin</a> per processare la richiesta.</p>
    `,
  });
}
