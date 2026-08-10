import type { Metadata } from "next";

/**
 * Impianto SEO internazionale — fonte unica dei metadati.
 *
 * Posizionamento: collezionismo di bottiglie reali con provenienza documentata.
 * Il vocabolario resta quello del collezionismo (colleziona, provenienza,
 * custodia, autenticità, rarità): niente termini di investimento o rendimento,
 * che oltre a violare il mandato attirerebbero un pubblico sbagliato.
 *
 * Ogni pagina dichiara le proprie versioni linguistiche (hreflang) e il proprio
 * indirizzo canonico, così i motori non trattano /it e /en come contenuti
 * duplicati ma come la stessa pagina in due lingue.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.winebank24.eu";
export const SITE_NAME = "Wine Bank 24";
export const LINGUE = ["it", "en"] as const;
export type Lingua = (typeof LINGUE)[number];

/** Mercati di riferimento: il pubblico del vino da collezione è internazionale */
const LOCALE = { it: "it_IT", en: "en_GB" } as const;

interface Pagina {
  lang: string;
  /** Percorso dopo la lingua, es. "/marketplace". Vuoto per la home. */
  path?: string;
  titolo: string;
  descrizione: string;
  /** Immagine di anteprima specifica; in mancanza si usa quella del sito */
  immagine?: string;
  /** Pagine che non devono finire nell'indice (aree riservate, contenuti demo) */
  noIndex?: boolean;
}

/**
 * Costruisce i metadati completi di una pagina: titolo, descrizione,
 * canonical, hreflang per ogni lingua, Open Graph e scheda Twitter.
 */
export function metadatiPagina({ lang, path = "", titolo, descrizione, immagine, noIndex }: Pagina): Metadata {
  const lingua = (LINGUE.includes(lang as Lingua) ? lang : "it") as Lingua;
  const url = `${SITE_URL}/${lingua}${path}`;

  // x-default indica ai motori quale versione servire quando la lingua
  // dell'utente non corrisponde a nessuna delle nostre
  const languages: Record<string, string> = Object.fromEntries(
    LINGUE.map((l) => [l, `${SITE_URL}/${l}${path}`])
  );
  languages["x-default"] = `${SITE_URL}/en${path}`;

  const anteprima = immagine ?? `${SITE_URL}/opengraph-image`;

  return {
    metadataBase: new URL(SITE_URL),
    title: titolo,
    description: descrizione,
    alternates: { canonical: url, languages },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: LOCALE[lingua],
      alternateLocale: LINGUE.filter((l) => l !== lingua).map((l) => LOCALE[l]),
      url,
      title: titolo,
      description: descrizione,
      images: [{ url: anteprima, width: 1200, height: 630, alt: titolo }],
    },
    twitter: {
      card: "summary_large_image",
      title: titolo,
      description: descrizione,
      images: [anteprima],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/**
 * Testi delle pagine pubbliche.
 *
 * I titoli mettono davanti ciò che la persona sta cercando (bottiglie da
 * collezione, provenienza, cantine) e non la tecnologia: chi cerca "NFT" non è
 * il nostro pubblico, chi cerca "vini da collezione" sì.
 */
export const TESTI_SEO = {
  home: {
    it: {
      titolo: "Wine Bank 24 — Bottiglie da collezione con proprietà certificata",
      descrizione:
        "Colleziona grandi vini con provenienza documentata e autenticità verificata. Ogni certificato digitale è collegato a una bottiglia reale, custodita in cantina in condizioni controllate.",
    },
    en: {
      titolo: "Wine Bank 24 — Collectible wine with certified ownership",
      descrizione:
        "Collect fine wine with documented provenance and verified authenticity. Every digital certificate is linked to a real bottle, kept in the winery under controlled conditions.",
    },
  },
  marketplace: {
    it: {
      titolo: "Bottiglie disponibili — Catalogo dei vini da collezione",
      descrizione:
        "Sfoglia le bottiglie da collezione disponibili: produttore, annata, denominazione, vitigno e condizioni di conservazione. Ogni certificato documenta una bottiglia reale.",
    },
    en: {
      titolo: "Available bottles — Collectible wine catalogue",
      descrizione:
        "Browse available collectible bottles: producer, vintage, appellation, grape variety and storage conditions. Every certificate documents a real bottle.",
    },
  },
  comeFunziona: {
    it: {
      titolo: "Come funziona — Collezionare bottiglie con certificato digitale",
      descrizione:
        "Scopri come funziona il collezionismo con Wine Bank 24: scelta della bottiglia, certificato di proprietà, custodia in cantina certificata e ritiro del bene fisico.",
    },
    en: {
      titolo: "How it works — Collecting bottles with a digital certificate",
      descrizione:
        "How collecting works with Wine Bank 24: choosing a bottle, the ownership certificate, custody in a certified winery and physical delivery of the bottle.",
    },
  },
  blog: {
    it: {
      titolo: "Blog — Cultura del vino, annate e collezionismo",
      descrizione:
        "Storie di produttori, annate, denominazioni, metodi di conservazione e criteri di collezionismo enologico.",
    },
    en: {
      titolo: "Journal — Wine culture, vintages and collecting",
      descrizione:
        "Producer stories, vintages, appellations, storage methods and the criteria behind wine collecting.",
    },
  },
  cantine: {
    it: {
      titolo: "Cantine — I produttori su Wine Bank 24",
      descrizione:
        "Le cantine verificate che emettono certificati e custodiscono le bottiglie in condizioni controllate, con polizza assicurativa.",
    },
    en: {
      titolo: "Wineries — Producers on Wine Bank 24",
      descrizione:
        "Verified wineries issuing certificates and keeping bottles under controlled conditions, with insurance cover.",
    },
  },
} as const;

/** Scelta della lingua con ripiego sull'italiano */
export function testo<T extends keyof typeof TESTI_SEO>(chiave: T, lang: string) {
  const gruppo = TESTI_SEO[chiave];
  return lang === "en" ? gruppo.en : gruppo.it;
}
