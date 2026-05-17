"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

export type CookieConsent = "accepted" | "declined" | null;

const STORAGE_KEY = "wb24_cookie_consent";

export function useCookieConsent(): CookieConsent {
  const [consent, setConsent] = useState<CookieConsent>(null);
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as CookieConsent;
    setConsent(stored);
    window.addEventListener("wb24:cookie-consent", () => {
      setConsent(localStorage.getItem(STORAGE_KEY) as CookieConsent);
    });
  }, []);
  return consent;
}

export function CookieBanner({ lang }: { lang: string }) {
  const [visible, setVisible] = useState(false);
  const en = lang === "en";

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  function respond(choice: "accepted" | "declined") {
    localStorage.setItem(STORAGE_KEY, choice);
    window.dispatchEvent(new Event("wb24:cookie-consent"));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-stone-900 border border-stone-700 rounded-xl shadow-2xl p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
        <Cookie className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-stone-300 leading-relaxed">
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
            className="border-stone-600 text-stone-300 hover:bg-stone-800"
          >
            {en ? "Decline" : "Rifiuta"}
          </Button>
          <Button
            size="sm"
            onClick={() => respond("accepted")}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
          >
            {en ? "Accept all" : "Accetta tutti"}
          </Button>
        </div>
      </div>
    </div>
  );
}
