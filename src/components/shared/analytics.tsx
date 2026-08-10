"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useCookieConsent } from "./cookie-banner";

/**
 * Analytics subordinato al consenso (GDPR art. 6 e Direttiva ePrivacy).
 *
 * I cookie analitici non sono necessari al funzionamento del servizio: la
 * Cookie Policy li dichiara soggetti a consenso, quindi lo script non deve
 * essere caricato finché l'utente non accetta. Finché il consenso manca o è
 * negato, qui non viene emesso nulla.
 */
export function Analytics({ gaId }: { gaId: string }) {
  const consent = useCookieConsent();
  if (consent !== "accepted") return null;
  return <GoogleAnalytics gaId={gaId} />;
}
