"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

export type CookieConsent = "accepted" | "declined" | null;

const STORAGE_KEY = "wb24_cookie_consent";

function subscribe(callback: () => void) {
  window.addEventListener("wb24:cookie-consent", callback);
  return () => window.removeEventListener("wb24:cookie-consent", callback);
}

function getSnapshot(): CookieConsent {
  return localStorage.getItem(STORAGE_KEY) as CookieConsent;
}

export function useCookieConsent(): CookieConsent {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function CookieBanner({ lang }: { lang: string }) {
  // "pending" on the server keeps the banner hidden until hydration
  const consent = useSyncExternalStore(subscribe, getSnapshot, () => "pending" as const);
  const en = lang === "en";

  function respond(choice: "accepted" | "declined") {
    localStorage.setItem(STORAGE_KEY, choice);
    window.dispatchEvent(new Event("wb24:cookie-consent"));
  }

  if (consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-[var(--wine-card)] border border-[var(--wine-border)] rounded-xl shadow-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
        <Cookie className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-white/70 leading-relaxed">
          {en ? (
            <>
              We use cookies to improve your experience and, with your consent, to show relevant advertising.
              Read our{" "}
              <Link href={`/${lang}/cookie`} className="text-amber-400 hover:underline">Cookie Policy</Link>
              {" "}and{" "}
              <Link href={`/${lang}/privacy`} className="text-amber-400 hover:underline">Privacy Policy</Link>.
            </>
          ) : (
            <>
              Utilizziamo cookie tecnici e, previo consenso, cookie pubblicitari per mostrarti annunci pertinenti.
              Leggi la nostra{" "}
              <Link href={`/${lang}/cookie`} className="text-amber-400 hover:underline">Cookie Policy</Link>
              {" "}e la{" "}
              <Link href={`/${lang}/privacy`} className="text-amber-400 hover:underline">Privacy Policy</Link>.
            </>
          )}
        </div>
        <div className="flex gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => respond("declined")}
            className="border-[var(--wine-border)] text-white/70 hover:bg-[var(--wine-card-hover)]"
          >
            {en ? "Decline" : "Rifiuta"}
          </Button>
          <Button
            size="sm"
            onClick={() => respond("accepted")}
            className="text-white font-semibold" style={{ background: "var(--wine-gradient)" }}
          >
            {en ? "Accept all" : "Accetta tutti"}
          </Button>
        </div>
      </div>
    </div>
  );
}
