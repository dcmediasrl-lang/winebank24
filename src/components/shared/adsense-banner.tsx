"use client";

import { useEffect, useRef } from "react";
// ref on <ins> is kept for future use (e.g. checking ad visibility)
import { useCookieConsent } from "./cookie-banner";

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
      // @ts-ignore adsbygoogle is injected by Google
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initialized.current = true;
    } catch {}
  }, [consent]);

  // Don't render if no publisher ID configured yet
  if (!PUBLISHER_ID) {
    return (
      <div className={`bg-stone-100 border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center text-stone-400 text-xs ${className}`}
        style={{ minHeight: 90 }}>
        Spazio pubblicitario — Google AdSense (da configurare)
      </div>
    );
  }

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
