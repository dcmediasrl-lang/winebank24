"use client";

import { useEffect, useRef } from "react";
// ref on <ins> is kept for future use (e.g. checking ad visibility)
import { useCookieConsent } from "./cookie-banner";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

interface AdSenseBannerProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal";
  className?: string;
}

const PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_ID || ""; // ca-pub-XXXXXXXXXX

export function AdSenseBanner({ slot, format = "auto", className = "" }: AdSenseBannerProps) {
  const consent = useCookieConsent();
  const ref = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (consent !== "accepted" || !PUBLISHER_ID || initialized.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initialized.current = true;
    } catch {}
  }, [consent]);

  // §15 — nessun segnaposto in produzione: senza publisher ID lo spazio
  // pubblicitario semplicemente non esiste per il visitatore
  if (!PUBLISHER_ID) return null;

  if (consent !== "accepted") return null;

  return (
    <div className={className}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
