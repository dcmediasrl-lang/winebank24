import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.winebank24.eu";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Aree riservate, flussi di pagamento e API non vanno indicizzati
      disallow: [
        "/api/",
        "/it/collector/", "/en/collector/",
        "/it/cantina/", "/en/cantina/",
        "/it/admin/", "/en/admin/",
        "/it/checkout/", "/en/checkout/",
        "/it/complete-profile", "/en/complete-profile",
        "/it/reset-password", "/en/reset-password",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
