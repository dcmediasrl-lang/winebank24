# Wine Bank 24 — Stato del progetto

> Documento di continuità. Viene caricato automaticamente all'avvio di Claude Code
> tramite `CLAUDE.md`, così qualsiasi sessione — su qualsiasi computer — riparte
> con il contesto giusto. **Va aggiornato quando cambia qualcosa di strutturale.**
>
> Ultimo aggiornamento: 3 agosto 2026

---

## Cos'è

Piattaforma di **collezionismo** di bottiglie di vino: le cantine emettono certificati
digitali collegati a bottiglie fisiche reali, i collezionisti li acquistano, li cedono
fra loro e — quando la cantina lo consente — riscattano la bottiglia.

Produzione: **https://app.winebank24.eu** · Repository: `dcmediasrl-lang/winebank24`

### Posizionamento — vincolo non negoziabile

La piattaforma **non** va sviluppata, descritta o presentata come strumento finanziario,
di investimento o di risparmio. Vietati nei testi, nel codice, nelle email e nei dati:
*investimento, rendimento, guadagno, profitto, portafoglio, performance, ROI,
rivalutazione, opportunità finanziaria*.

Linguaggio corretto: *colleziona, custodisci, possiedi, certificato digitale,
provenienza documentata, trasferimento della proprietà, passaggio tra collezionisti*.

Riferimento completo: `Wine Bank 24 — Audit e Sviluppo Collezionistico.pdf` (mandato di progetto).

**Mai scrivere** che la piattaforma è esclusa dalla MiFID II senza parere legale scritto.
La formula approvata, presente oggi in tutta la piattaforma, è:

> Wine Bank 24 è progettata come piattaforma per il collezionismo e la compravendita di
> bottiglie fisiche. Non offre consulenza finanziaria, rendimenti, interessi o garanzie
> di rivalutazione.

---

## Impianto tecnico

Next.js 16 (App Router) · TypeScript · React 19 · NextAuth v5 · Prisma 7 + PostgreSQL
(Supabase) · Stripe Checkout + Connect · Cloudflare R2 · Vercel · i18n IT/EN.

| Cosa | Dove |
|---|---|
| Deploy | `npx vercel deploy --prod` |
| Variabili d'ambiente | `.env` (mai su git) — modello in `.env.example`, valori con `npx vercel env pull .env` |
| Generatori documenti | `scripts/genera-*.py` — business plan, mappa concettuale, checklist legale |
| Regola contenuti demo | `src/lib/demo-content.ts` |
| Validazione codici fiscali | `src/lib/tax-id.ts` (28 paesi) |
| Metadati e posizionamento SEO | `src/lib/seo.ts` — titoli, hreflang, Open Graph |
| Recapiti ufficiali | `src/lib/contatti.ts` — mai scrivere email a mano |
| Trasferimenti dopo pagamento | `src/lib/offer-transfer.ts` |
| Certificato di proprietà (PDF + QR + seriale) | `src/lib/certificate.ts`, `src/lib/certificate-pdf.ts` |

---

## Regole di business attive

**Commissioni** — piattaforma 7% sull'acquirente; 3% sul venditore nelle cessioni fra
collezionisti; royalty cantina 1–10% (scelta all'emissione) sulle cessioni; emissione
certificato 5% a carico della cantina; riscatto bottiglia 5% + IVA 22% sulla commissione
+ spedizione. La commissione resta alla piattaforma, IVA e spedizione vanno alla cantina.

**Pagamenti** — nessun trasferimento di proprietà avviene senza pagamento confermato dal
webhook Stripe. Il webhook è idempotente (chiave: `stripeId` sulla transazione) e verifica
che il venditore possieda ancora il bene.

**Offerte** — il venditore accetta, l'offerta passa in attesa di pagamento, l'acquirente
paga, solo allora la proprietà si trasferisce.

**Riscatto** — solo se la cantina lo abilita. Su un certificato frazionato serve il 100%
delle quote.

**Identità** — nome, cognome, data di nascita, paese e codice fiscale/TIN/ITIN di 28 paesi,
validati con checksum e confrontati con i dati anagrafici. Verifica 18+. Codice unico per
account (vincolo anche sul database).

**Accesso Google** — non crea account: consente solo l'accesso a chi si è già registrato.

**Login** — richiede l'email verificata: senza clic sul link ricevuto via email l'accesso è
bloccato, anche con password corretta. Prima del 23 agosto 2026 questo controllo mancava —
bastava conoscere la password per entrare con un'email mai verificata, anche inesistente.
Corretto in `src/lib/auth.ts` (blocco) e propagato correttamente al frontend tramite
`CredentialsSignin`/`result.code` — il precedente `throw new Error(...)` non arrivava più al
client con le versioni recenti di NextAuth (bug dormiente anche sul flusso 2FA, risolto
insieme).

**Certificato di proprietà** — emesso automaticamente solo dopo la conferma di pagamento
Stripe (mai prima), inviato via email al proprietario e scaricabile dalla collezione. Ogni
certificato ha un seriale univoco (`WB24-XXXXXXXXXX`) e un QR verso una pagina pubblica di
verifica (`/certificato/[seriale]`) che mostra sempre lo stato aggiornato, senza mai rivelare
l'identità del proprietario. Il PDF scaricato non può essere revocato da remoto — l'invalidazione
è sulla verifica, non sul file: `Nft.certificateVersion` si incrementa a ogni cessione (vendita
diretta o offerta accettata su un NFT intero) e al riscatto fisico; la pagina di verifica
confronta la versione stampata sul certificato con quella corrente e segnala "non più valido"
se non coincidono. Scoperto due difetti minori nella scheda bottiglia mentre ci si lavorava:
titolo duplicato quando l'annata era già nel nome ("2018 2018", corretto) e residui di lessico
"NFT" in testi pubblici sostituiti con "certificato" (marketplace, collezione, dashboard,
dizionari IT/EN).

Anche le quote (co-proprietà frazionata) emettono un certificato — di **comproprietà**, non di
proprietà piena: riporta la percentuale posseduta e dichiara esplicitamente che non dà da solo
diritto al ritiro fisico (serve il 100% delle quote). Stessa logica di invalidazione, ma su
`NftFraction.certificateVersion`: si incrementa a ogni acquisto aggiuntivo, cessione parziale o
totale della quota. Una cessione parziale riemette **due** certificati (venditore con la quota
residua, acquirente con quella nuova); una cessione totale della stessa riga ne emette uno solo,
per l'acquirente.

**Registrazione cantina** — rivista su 4 punti dopo un audit:
1. La creazione da Admin → Cantine → Nuova Cantina non manda più la password in chiaro via
   email: crea l'account senza password e invia un link di attivazione a scadenza 48h
   (`src/lib/cantina-invite.ts`, condiviso col "Reinvia invito" — prima erano due meccanismi
   diversi per lo stesso problema).
2. Il badge pubblico **"Verificata"** non basta più il solo interruttore admin: richiede anche
   che la cantina abbia caricato la polizza assicurativa (`isCantinaPubliclyVerified()` in
   `src/lib/cantina.ts`). Prima poteva comparire ai collezionisti senza alcun documento
   assicurativo caricato — coincide con un punto già segnalato dalla revisione esterna.
3. La dashboard cantina mostra una checklist ("Prossimi passi per iniziare": polizza, Stripe
   Connect, primo certificato) finché non è tutto completo, poi sparisce da sola. Prima non
   c'era alcuna guida: si scopriva il blocco sulla polizza solo provando a mintare.
4. Ripulito altro lessico "NFT" residuo (dashboard cantina, pagina pubblica cantina, email).

---

## Decisioni prese

| Decisione | Stato |
|---|---|
| **Blockchain Polygon** | Codice pronto, **non attivata** fino alla decisione sul lancio. Ogni riferimento pubblico è stato rimosso dal sito. Il blocco tecnico sulla scheda bottiglia è condizionale e si riattiva da solo quando i dati on-chain esistono. |
| **Vendita frazionata** | Resta **attiva**, pur essendo il punto a maggior rischio normativo. In attesa del parere legale. |
| **Contenuti dimostrativi** | Le cantine marcate `isDemo` spariscono dalle pagine pubbliche **solo in produzione**. Oggi entrambe le cantine sono dimostrative: il catalogo pubblico è vuoto. Reversibile dal pannello admin. |
| **Stripe** | Chiavi di **test**. Non passare alle chiavi live finché i dati societari non sono completi (§16 del mandato). |

---

## Lavoro in corso

Riferimento: artifact **"Wine Bank 24 — Audit e piano di lavoro"** (16 ticket).

**Chiusi:** WB-01 · WB-02 · WB-03 · WB-04 · WB-05 · WB-07 · WB-08 · WB-09 · WB-11

**Aperti:**

- **WB-06 — Dati societari** *(bloccante, attende dati reali)*
  Servono ragione sociale, sede, partita IVA, REA, PEC, rappresentante legale.
  Vanno centralizzati in un'unica configurazione, non scritti nei singoli file.
  Il footer mostra ancora «P.IVA: in fase di registrazione».
  Da correggere anche il nome piattaforma su Stripe: al checkout compare «DC MEDIA».
- **WB-10** — La scheda bottiglia non contiene fotografie, condizioni, provenienza e dati
  di custodia richiesti dal §13 del mandato.
- **WB-12** — Filtri catalogo incompleti (mancano produttore, formato, fascia di prezzo,
  custode, stato di verifica) e nessun ordinamento.
- **WB-13** — Mancano i ruoli custode, operatore e collezionista verificato. Oggi la
  cantina è anche custode.
- **WB-14** — Il flusso di consegna si ferma all'approvazione: mancano preventivo,
  tracking, assicurazione della spedizione e conferma di consegna.
- **WB-15** — Nessun controllo automatico che impedisca il rientro del lessico finanziario.
- **WB-16** — Accessibilità e performance mai misurate (obiettivo WCAG 2.2 AA).

### Questione aperta

«Tenuta di Ornellaia» è un account di prova che porta il nome di una cantina reale con
marchio registrato. Oggi è nascosta perché dimostrativa, ma **prima di riattivarla** va
rinominata con un nome di fantasia, salvo che esista un accordo reale.

---

## Modo di lavorare

- **Salvare su GitHub** al termine di ogni sessione di lavoro: `git add -A && git commit && git push`.
- **Verificare in produzione** dopo ogni deploy, non fermarsi al «build riuscito».
- **Mai usare l'account reale di Melissa** (dcmediasrl@gmail.com) per test che generano
  email, notifiche o addebiti: creare un account di prova dedicato ed eliminarlo dopo.
- **Non inventare dati** societari, legali, tecnici o assicurativi: se mancano, chiederli.
- Prima di un intervento strutturale indicare problema, evidenza, file coinvolti, soluzione,
  rischi e criterio di accettazione.
