import { SITE_URL, SITE_NAME } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/contatti";

/**
 * Dati strutturati Schema.org.
 *
 * Servono ai motori per capire *cosa* è questa pagina, non solo cosa contiene:
 * un'organizzazione, un prodotto da collezione, un percorso di navigazione.
 * È ciò che abilita i risultati arricchiti (immagine, prezzo, briciole di pane)
 * nelle pagine di ricerca.
 */

function Json({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // I dati sono costruiti da noi, non da input utente
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Identità della piattaforma e ricerca interna — da mettere in home */
export function DatiOrganizzazione({ lang }: { lang: string }) {
  const en = lang === "en";
  return (
    <Json
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organizzazione`,
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/logo.png`,
            email: SUPPORT_EMAIL,
            description: en
              ? "Platform for collecting fine wine bottles with certified ownership and documented provenance."
              : "Piattaforma per il collezionismo di bottiglie di vino pregiato con proprietà certificata e provenienza documentata.",
            sameAs: [
              "https://instagram.com/winebank24",
              "https://facebook.com/winebank24",
            ],
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#sito`,
            url: SITE_URL,
            name: SITE_NAME,
            inLanguage: en ? "en" : "it",
            publisher: { "@id": `${SITE_URL}/#organizzazione` },
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${SITE_URL}/${lang}/marketplace?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          },
        ],
      }}
    />
  );
}

interface Bottiglia {
  id: string;
  nome: string;
  descrizione: string | null;
  immagine: string | null;
  annata: number | null;
  formato: string | null;
  prezzo: number | null;
  disponibile: boolean;
  produttore: string;
  denominazione: string | null;
  regione: string | null;
}

/** Scheda bottiglia: prodotto da collezione con provenienza */
export function DatiBottiglia({ lang, b }: { lang: string; b: Bottiglia }) {
  const en = lang === "en";
  const url = `${SITE_URL}/${lang}/nft/${b.id}`;

  const proprieta = [
    b.annata && { "@type": "PropertyValue", name: en ? "Vintage" : "Annata", value: String(b.annata) },
    b.denominazione && { "@type": "PropertyValue", name: en ? "Appellation" : "Denominazione", value: b.denominazione },
    b.regione && { "@type": "PropertyValue", name: en ? "Region" : "Regione", value: b.regione },
    b.formato && { "@type": "PropertyValue", name: en ? "Format" : "Formato", value: b.formato },
  ].filter(Boolean);

  return (
    <Json
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${url}#prodotto`,
        name: b.annata ? `${b.nome} ${b.annata}` : b.nome,
        description: b.descrizione ?? undefined,
        image: b.immagine ?? undefined,
        url,
        category: en ? "Collectible wine" : "Vino da collezione",
        brand: { "@type": "Brand", name: b.produttore },
        additionalProperty: proprieta,
        ...(b.prezzo
          ? {
              offers: {
                "@type": "Offer",
                url,
                price: b.prezzo.toFixed(2),
                priceCurrency: "EUR",
                availability: b.disponibile
                  ? "https://schema.org/InStock"
                  : "https://schema.org/SoldOut",
                seller: { "@id": `${SITE_URL}/#organizzazione` },
                itemCondition: "https://schema.org/UsedCondition",
              },
            }
          : {}),
      }}
    />
  );
}

/** Percorso di navigazione, mostrato nei risultati di ricerca */
export function DatiPercorso({
  lang,
  voci,
}: {
  lang: string;
  voci: { nome: string; path: string }[];
}) {
  return (
    <Json
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: voci.map((v, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: v.nome,
          item: `${SITE_URL}/${lang}${v.path}`,
        })),
      }}
    />
  );
}
