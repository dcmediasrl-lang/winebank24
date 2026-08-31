import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // Header di sicurezza applicati a tutte le pagine
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Impedisce che il sito venga incorniciato in un iframe (clickjacking:
          // un truffatore che sovrappone il nostro checkout a una pagina finta)
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Blocca l'interpretazione di un file come tipo diverso da quello dichiarato
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Non trasmettere l'URL completo (che può contenere id) a siti terzi
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nega l'accesso a fotocamera, microfono, geolocalizzazione e pagamenti nativi
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          // Impone HTTPS per due anni, sottodomini inclusi
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Impedisce il caricamento cross-origin delle nostre risorse
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

// L'upload dei source map a Sentry (per stack trace leggibili) si attiva da
// solo quando SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN sono impostate;
// finché non esiste un account Sentry, questo wrapping non cambia nulla nel
// comportamento della build.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  telemetry: false,
});
