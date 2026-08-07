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
| Trasferimenti dopo pagamento | `src/lib/offer-transfer.ts` |

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
