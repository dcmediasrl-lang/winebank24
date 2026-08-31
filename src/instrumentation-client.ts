import * as Sentry from "@sentry/nextjs";

// Monitoraggio errori lato browser. Attivo solo se è stata configurata una
// chiave pubblica (NEXT_PUBLIC_SENTRY_DSN) — nessun impatto se non c'è.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

// Traccia anche gli errori che avvengono durante la navigazione client-side
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
