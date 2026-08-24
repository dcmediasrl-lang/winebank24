# Wine Bank 24 — Handoff tecnico per lo sviluppatore

> Documento di passaggio in vista dell'incontro. Scritto da sviluppatore a sviluppatore:
> cosa c'è, come funziona, cosa manca, dove mettere le mani.
>
> Repo: `dcmediasrl-lang/winebank24` · Produzione: `app.winebank24.eu` (Vercel)
> Ultimo commit: `55f6ccc` — "Impianto SEO per il mercato internazionale del vino da collezione"

---

## In una frase

App Next.js monolitica (frontend + API routes nello stesso progetto) che gestisce certificati
digitali collegati a bottiglie di vino reali: le cantine li emettono, i collezionisti li
comprano/rivendono/frazionano, e — se la cantina lo abilita — li riscattano ritirando la
bottiglia fisica. Pagamenti reali via Stripe, DB Postgres via Prisma, blockchain predisposta
ma **non accesa**.

---

## Stack

| Layer | Tecnologia | Note |
|---|---|---|
| Framework | Next.js **16** (App Router), React 19, TypeScript | ⚠️ Next 16 ha breaking change rispetto alle versioni note — `AGENTS.md` avvisa di leggere `node_modules/next/dist/docs/` prima di scrivere codice che assume comportamenti vecchi |
| Auth | NextAuth v5 (**ancora in beta**, `5.0.0-beta.31`) | Credenziali + Google, sessione JWT 7gg |
| DB | PostgreSQL su Supabase, via Prisma **7** + `@prisma/adapter-pg` | pooler su porta 5432, la stringa "direct" richiede IPv6 e non funziona ovunque |
| Pagamenti | Stripe Checkout + Stripe Connect | chiavi di **test**, non live |
| Storage | Cloudflare R2 (S3-compatibile) | immagini NFT |
| Email | Resend + nodemailer (entrambe in `package.json` — da chiarire quale sia davvero in uso) |
| Blockchain | Solidity + OpenZeppelin (ERC-721) + ethers.js, target Polygon | contratto scritto, **non deployato**, mint fa fallback automatico su solo-DB |
| Styling/UI | Tailwind 4, `@base-ui/react`, `react-hook-form` + `zod`, `zustand`, `react-query` |
| Deploy | Vercel, CLI manuale (`npx vercel deploy --prod`) — **nessuna CI/CD** |
| Test | **Nessuno**. Zero file `*.test.*`/`*.spec.*` nel repo |

---

## Modello dati (Prisma, 20 modelli — `prisma/schema.prisma`)

Il cuore è: `User` (3 ruoli: `ADMIN`, `CANTINA`, `COLLECTOR`) → `Cantina` 1:1 → `Nft` (il
certificato) → `Transaction` / `Offer` / `NftFraction` / `BurnRequest`.

Punti da conoscere prima di toccare lo schema:

- **`User.fiscalCode` è `@unique`** — vincolo anche a livello DB, non solo applicativo, per
  impedire doppie registrazioni con lo stesso codice fiscale/TIN/ITIN.
- **`Nft.status`** è una macchina a stati: `PENDING_PAYMENT → MINTED → LISTED → SOLD →
  BURN_REQUESTED → BURNED` (più `LIQUIDATION_REQUESTED/LIQUIDATED` per i frazionati).
- **`NftFraction`** gestisce la comproprietà: `percentage` + `investedAmount` per owner,
  con `listedPercentage` per la vendita parziale di una quota.
- **`Cantina.isDemo`** è il flag che nasconde contenuto dimostrativo in produzione (vedi sotto).
- **`User.deletedAt`** — la riga utente non si cancella mai (obbligo di conservazione decennale
  delle transazioni), si anonimizza.

---

## I flussi che contano davvero

### 1. Soldi → proprietà, mai il contrario
Questo è il punto architetturale più importante del progetto. **Nessun trasferimento di
proprietà avviene se non dentro `src/app/api/webhooks/stripe/route.ts`**, dopo che Stripe
conferma `checkout.session.completed`. La logica vera e propria è in
`src/lib/offer-transfer.ts` (`executeOfferTransfer`, `executeFractionResaleTransfer`):

- verifica idempotenza sul `stripeId` della transazione (webhook chiamato due volte → non
  duplica),
- verifica che il venditore possieda ancora il bene al momento del pagamento (anti
  doppia-vendita: due offerte accettate sullo stesso NFT, paga solo la prima, la seconda
  fallisce pulita),
- tutto dentro una `db.$transaction`.

Questa parte è stata **riscritta da zero** durante l'audit: in precedenza le offerte
trasferivano la proprietà all'accettazione, senza aspettare il pagamento — bug serio, corretto.

### 2. Emissione (mint) — `src/app/api/cantina/mint/route.ts`
- **Bloccata se la cantina non ha caricato la polizza assicurativa** (`insuranceDocUrl`) —
  vincolo contrattuale, non aggirabile dal frontend.
- Calcola una fee di emissione (% configurabile, minimo €0,50) e apre un checkout Stripe a
  carico della cantina.
- Se le env var blockchain sono impostate tenta il mint on-chain; se falliscono o mancano,
  **procede comunque solo su DB** — non blocca mai l'operazione per un problema blockchain.

### 3. Acquisto — `src/app/api/checkout/route.ts`
Calcolo commissioni fatto qui, non altrove:
- primaria: prezzo + commissione piattaforma 7% (a carico compratore)
- secondaria: prezzo + commissione 7% + royalty cantina (1-10%, impostata per bottiglia
  all'emissione) a carico compratore; venditore trattiene prezzo − 3%
- se la cantina ha Stripe Connect collegato → `application_fee_amount` +
  `transfer_data.destination`, split automatico

### 4. Riscatto fisico — `src/app/api/collector/burn-checkout/route.ts`
- Solo se `Nft.physicalDeliveryUnlocked` (la cantina lo abilita esplicitamente per quella
  bottiglia).
- Su un certificato frazionato: **serve possedere il 100% delle quote** prima di poter
  richiedere il ritiro — altrimenti si spedirebbe un bene ancora in comproprietà.
- Fee 5% + IVA 22% sulla fee + spedizione — **fee resta alla piattaforma, IVA e spedizione
  vanno alla cantina** (regola di business, non ovvia leggendo solo il codice).
- Poi passa da approvazione admin (`api/admin/burn-approve`) — **da lì in poi il flusso si
  ferma**: nessun tracking, nessuna integrazione corriere. È un ticket aperto (vedi sotto).

### 5. Login
- Credenziali: bcrypt, blocco a 5 tentativi falliti (30 min), 2FA TOTP opzionale.
- Google: **solo login, mai registrazione**. Il callback `signIn` in `src/lib/auth.ts`
  verifica che esista già uno `User` con `password` impostata per quell'email; altrimenti
  redirect a login con errore. Ci sono voluti diversi tentativi per farlo funzionare bene
  (il primo redirect era via layout, che in App Router **gira in parallelo alla page** — un
  redirect nel layout non impedisce alla page di eseguire comunque. Soluzione finale: check
  diretto nel layout collector con dati freschi dal DB, non dal JWT che poteva essere stale).

---

## Sicurezza — cosa è già dentro

- Rate limiting su login/checkout via tabella `RateLimit` (fail-open se il DB non risponde —
  scelta deliberata, non blocca l'intera piattaforma per un problema di rate limiter).
- Header di sicurezza globali in `next.config.ts`: `X-Frame-Options`, HSTS, CSP sulle
  immagini, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.
- `ActivityLog` su azioni sensibili (login falliti, blocchi, acquisti) con IP.
- 2FA TOTP (`otplib`), non solo decorativo — verificato al login se attivo.
- Diritto alla cancellazione GDPR (`src/lib/account-deletion.ts`): **anonimizzazione, non
  delete** — la riga resta per obbligo fiscale decennale (art. 2220 c.c.), ma email, nome,
  documento, codice fiscale vengono azzerati/randomizzati. Bloccata se: sei admin, hai una
  cantina con obblighi contrattuali, possiedi ancora NFT/quote, hai offerte aperte.
- **KYC write-once**: una volta salvati nome/cognome/data nascita/codice fiscale, l'utente
  non può più modificarli da solo (`api/user/kyc/route.ts` risponde 403) — deve passare dal
  supporto. Evita che qualcuno cambi identità dopo la verifica.

Cosa **non** è stato verificato/manca:
- Nessun test automatico sui flussi di pagamento — il rischio più alto del progetto, dato che
  un bug qui è un danno economico diretto.
- Nessuna pipeline CI/CD.
- Non verificato se i dati sensibili (documento identità, codice fiscale) sono cifrati a
  riposo — dipende dalla config Supabase, non dal codice applicativo.

---

## Il vincolo di prodotto che condiziona tutto il resto

Wine Bank 24 **non deve mai apparire come strumento finanziario**. Non è una preferenza di
copy, è un vincolo di business con implicazioni legali (rischio di ricadere sotto MiFID II).
Vietati ovunque — testi, codice, email, nomi di variabili nei posti visibili all'utente:
*investimento, rendimento, guadagno, portafoglio, performance, ROI*.

Per questo:
- la sezione "i miei NFT" si chiama **"Collezione"**, non "Portfolio" (c'è anche un redirect
  legacy in `src/middleware.ts` per i vecchi link).
- la vendita frazionata è descritta come comproprietà da collezionisti, non come investimento
  frazionato — pur essendo, tecnicamente, il punto più vicino a un prodotto finanziario. È
  **in attesa di parere legale scritto**, non ancora arrivato.
- Google Analytics si carica solo dopo consenso cookie (prima violava il GDPR caricando
  sempre — corretto durante l'audit).

Se il nuovo sviluppatore scrive testi o nomi di campo visibili, questo vincolo va rispettato
anche lì.

---

## Cosa è pronto ma spento

**Blockchain (Polygon).** Contratto `WineBank24.sol` (ERC-721, mint/burn) scritto e
compilabile con Hardhat, libreria di collegamento (`src/lib/blockchain.ts`) pronta. Il mint
controlla `blockchainReady` (env var wallet + contratto impostate) e se non lo è **non
blocca**, procede solo su DB. Nessun deploy fatto. Attivazione rimandata a decisione
sul lancio.

**Contenuto demo.** Le uniche due cantine nel DB sono marcate `isDemo: true` e vengono
filtrate dalle pagine pubbliche **solo in produzione** (`src/lib/demo-content.ts`, basato su
`VERCEL_ENV === "production"`). Risultato: il catalogo pubblico oggi è vuoto, di proposito —
non è un bug se lo vede vuoto.

⚠️ Una delle due cantine demo si chiama **"Tenuta di Ornellaia"** — nome di un marchio reale
registrato. Va rinominata prima di qualsiasi riattivazione pubblica, salvo accordo reale con
la cantina.

---

## Ticket aperti (da `STATO-PROGETTO.md`)

**Bloccante:**
- **WB-06 — Dati societari.** Mancano ragione sociale, sede, P.IVA, REA, PEC. Il footer
  mostra ancora "P.IVA: in fase di registrazione" e su Stripe checkout compare "DC MEDIA"
  invece di Wine Bank 24. Finché non arrivano questi dati, niente chiavi Stripe live.

**Aperti, non bloccanti:**
- WB-10 — scheda bottiglia incompleta (foto multiple, condizioni, provenienza dettagliata)
- WB-12 — filtri marketplace incompleti (produttore, formato, prezzo, custode, verifica),
  nessun ordinamento
- WB-13 — mancano i ruoli custode/operatore/collezionista verificato — oggi la cantina fa
  anche da custode
- WB-14 — consegna fisica si ferma all'approvazione admin: manca preventivo, tracking,
  assicurazione spedizione, conferma consegna
- WB-15 — nessun controllo automatico che impedisca al lessico finanziario di rientrare nei
  testi
- WB-16 — accessibilità e performance mai misurate (target WCAG 2.2 AA)

---

## Cose da sapere prima di aprire l'editor

1. **`.env` non è nel repo** (gitignored). Modello in `.env.example` — solo nomi delle
   variabili, nessun valore. Per un valore reale: `npx vercel env pull .env`.
2. **Mai testare su `dcmediasrl@gmail.com`** (l'account reale di Melissa) per azioni che
   generano email, notifiche o addebiti — è già successo un invio accidentale di reset
   password. Creare un account di prova dedicato.
3. **Prisma 7 + `db push`** su una colonna nuova con `@unique` dà un avviso di possibile
   perdita dati anche su colonna vuota — è un falso positivo noto, si accetta con
   `--accept-data-loss` dopo aver verificato che la colonna sia effettivamente vuota.
4. `STATO-PROGETTO.md` è il documento di continuità: viene letto automaticamente
   all'avvio di ogni sessione di lavoro (richiamato da `AGENTS.md`/`CLAUDE.md`). Va
   aggiornato a mano quando cambia qualcosa di strutturale — è la fonte di verità più
   aggiornata insieme a questo file.
5. Generatori di documenti (business plan, mappa concettuale, checklist legale) sono in
   `scripts/genera-*.py`, non nel codice dell'app.

---

## Da dove ripartire, in pratica

Se lo sviluppatore chiede "cosa mi conviene guardare per primo": `prisma/schema.prisma` per
il modello dati, poi `src/lib/offer-transfer.ts` + `src/app/api/webhooks/stripe/route.ts` per
capire il cuore transazionale, poi `STATO-PROGETTO.md` per il contesto di business e i ticket
aperti. Tutto il resto (form, pagine, componenti UI) è prevedibile una volta capiti questi tre.
