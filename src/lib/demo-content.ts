/**
 * Contenuti dimostrativi (§15 del mandato di riposizionamento).
 *
 * Nessun dato dimostrativo deve essere confuso con un dato reale: le cantine
 * marcate `isDemo` e le loro bottiglie restano visibili al proprietario e agli
 * amministratori, ma spariscono dalle pagine pubbliche in produzione e non
 * vengono indicizzate dai motori di ricerca.
 *
 * In sviluppo e staging restano visibili, così il catalogo resta testabile.
 */

/** In produzione i contenuti dimostrativi non compaiono al pubblico */
export const HIDE_DEMO_IN_PUBLIC = process.env.VERCEL_ENV === "production";

/**
 * Filtro Prisma da innestare nelle query pubbliche sugli NFT.
 * Vuoto fuori produzione, così staging e sviluppo mostrano tutto.
 */
export const publicNftFilter = HIDE_DEMO_IN_PUBLIC
  ? { cantina: { isDemo: false } }
  : {};

/** Filtro Prisma per gli elenchi pubblici di cantine */
export const publicCantinaFilter = HIDE_DEMO_IN_PUBLIC ? { isDemo: false } : {};

/**
 * Una pagina di dettaglio che mostra contenuto dimostrativo non va indicizzata.
 * Da passare a `robots` nei metadata della pagina.
 */
export const demoRobots = { index: false, follow: false } as const;
