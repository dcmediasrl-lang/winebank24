import type { captureRequestError } from "@sentry/nextjs";

// Monitoraggio errori lato server (Sentry). Se SENTRY_DSN non è impostata
// (locale, o finché non è stato creato un account Sentry) non fa nulla: nessun
// impatto sull'app, nessun avviso rumoroso nei log.
export async function register() {
  if (!process.env.SENTRY_DSN) return;
  if (process.env.NEXT_RUNTIME !== "nodejs" && process.env.NEXT_RUNTIME !== "edge") return;

  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    // Non registrare mai contenuto delle richieste (potrebbe includere
    // password, token di sessione, dati di pagamento)
    sendDefaultPii: false,
  });
}

export const onRequestError = async (...args: Parameters<typeof captureRequestError>) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
