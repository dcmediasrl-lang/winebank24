import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { publicNftFilter, publicCantinaFilter } from "@/lib/demo-content";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.winebank24.eu";
const LINGUE = ["it", "en"] as const;

/** Una voce per lingua, con rimando reciproco fra le due versioni */
function perLingua(percorso: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) {
  return LINGUE.map((lang) => ({
    url: `${BASE}/${lang}${percorso}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(LINGUE.map((l) => [l, `${BASE}/${l}${percorso}`])),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statiche = [
    ...perLingua("", 1, "weekly"),
    ...perLingua("/marketplace", 0.9, "daily"),
    ...perLingua("/come-funziona", 0.8, "monthly"),
    ...perLingua("/blog", 0.6, "weekly"),
    ...perLingua("/termini", 0.3, "yearly"),
    ...perLingua("/privacy", 0.3, "yearly"),
    ...perLingua("/cookie", 0.3, "yearly"),
  ];

  // I contenuti dimostrativi restano fuori dall'indicizzazione (§15)
  const [nfts, cantine, articoli] = await Promise.all([
    db.nft.findMany({
      where: { isListed: true, status: "LISTED", ...publicNftFilter },
      select: { id: true, updatedAt: true },
    }).catch(() => []),
    db.cantina.findMany({
      where: { isVerified: true, isBlocked: false, ...publicCantinaFilter },
      select: { id: true, updatedAt: true },
    }).catch(() => []),
    db.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }).catch(() => []),
  ]);

  const dinamiche: MetadataRoute.Sitemap = [
    ...nfts.flatMap((n) =>
      LINGUE.map((lang) => ({
        url: `${BASE}/${lang}/nft/${n.id}`,
        lastModified: n.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }))
    ),
    ...cantine.flatMap((c) =>
      LINGUE.map((lang) => ({
        url: `${BASE}/${lang}/cantine/${c.id}`,
        lastModified: c.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }))
    ),
    ...articoli.flatMap((a) =>
      LINGUE.map((lang) => ({
        url: `${BASE}/${lang}/blog/${a.slug}`,
        lastModified: a.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }))
    ),
  ];

  return [...statiche, ...dinamiche];
}
