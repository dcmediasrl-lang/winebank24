#!/usr/bin/env python3
# Genera la checklist da sottoporre all'avvocato specializzato.
# Uso: python3 scripts/genera-checklist-legale.py
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether,
)

OUTPUT = "/Users/melissa/Documents/Wine Bank 24 — Checklist per revisione legale.pdf"

WINE = colors.HexColor("#A21C19")
INK = colors.HexColor("#13110C")
SOFT = colors.HexColor("#4B4642")
FAINT = colors.HexColor("#8B857F")
PANEL = colors.HexColor("#F5F2EC")
RULE = colors.HexColor("#DDD7CF")

st_title = ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=20, textColor=INK, leading=24, spaceAfter=4)
st_sub = ParagraphStyle("s", fontName="Helvetica", fontSize=9.5, textColor=FAINT, spaceAfter=16)
st_h1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=12.5, textColor=WINE, spaceBefore=16, spaceAfter=7)
st_h2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=10, textColor=INK, spaceBefore=11, spaceAfter=4)
st_body = ParagraphStyle("b", fontName="Helvetica", fontSize=9.5, leading=13.5, textColor=SOFT,
                         alignment=TA_JUSTIFY, spaceAfter=6)
st_q = ParagraphStyle("q", fontName="Helvetica", fontSize=9.5, leading=13.5, textColor=SOFT,
                      leftIndent=14, bulletIndent=2, spaceAfter=4)
st_note = ParagraphStyle("n", fontName="Helvetica-Oblique", fontSize=8.5, leading=12, textColor=FAINT, spaceBefore=4)
st_cell = ParagraphStyle("c", fontName="Helvetica", fontSize=8.5, leading=11, textColor=SOFT)
st_quote = ParagraphStyle("qt", fontName="Helvetica-Oblique", fontSize=9, leading=13, textColor=INK,
                          leftIndent=12, rightIndent=12, spaceBefore=4, spaceAfter=4)


def h1(t): return Paragraph(t, st_h1)
def h2(t): return Paragraph(t, st_h2)
def p(t): return Paragraph(t, st_body)
def q(t): return Paragraph(t, st_q, bulletText="□")
def note(t): return Paragraph(t, st_note)


def panel(testo, style=st_quote):
    t = Table([[Paragraph(testo, style)]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PANEL),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LINEBEFORE", (0, 0), (0, -1), 2, WINE),
    ]))
    return t


def tabella(dati, widths):
    rows = [[Paragraph(f'<font color="white"><b>{c}</b></font>', st_cell) for c in dati[0]]]
    rows += [[Paragraph(c, st_cell) for c in r] for r in dati[1:]]
    t = Table(rows, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), WINE),
        ("GRID", (0, 0), (-1, -1), 0.4, RULE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ]))
    return t


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(FAINT); canvas.setFont("Helvetica", 7)
    canvas.drawString(20 * mm, 12 * mm, "Wine Bank 24 — Checklist per revisione legale · Luglio 2026 · Documento riservato")
    canvas.drawRightString(190 * mm, 12 * mm, f"Pag. {doc.page}")
    canvas.setStrokeColor(RULE); canvas.setLineWidth(0.5)
    canvas.line(20 * mm, 15 * mm, 190 * mm, 15 * mm)
    canvas.restoreState()


doc = SimpleDocTemplate(OUTPUT, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm,
                        topMargin=18 * mm, bottomMargin=22 * mm,
                        title="Wine Bank 24 — Checklist per revisione legale", author="Wine Bank 24")
S = []
W = 170 * mm

# ══ INTESTAZIONE ══
S.append(Paragraph("Checklist per revisione legale", st_title))
S.append(Paragraph("Wine Bank 24 · piattaforma di collezionismo di bottiglie di vino · app.winebank24.eu · Luglio 2026", st_sub))

S.append(p(
    "Questo documento raccoglie i punti che richiedono un parere legale scritto prima dell'apertura al pubblico "
    "della piattaforma. È redatto dal team di sviluppo e descrive <b>il funzionamento effettivo del software</b> "
    "alla data indicata: non contiene valutazioni giuridiche, che sono oggetto dell'incarico."))
S.append(p(
    "Le domande sono raggruppate per area. Alcune funzioni sono <b>già attive in produzione</b>, altre sono state "
    "<b>volutamente non implementate</b> in attesa del parere: la distinzione è indicata in ogni sezione."))

S.append(panel(
    "<b>Richiesta prioritaria.</b> La piattaforma consente oggi l'acquisto di percentuali di una singola bottiglia "
    "da parte di più soggetti (§B). È la funzione con il maggiore impatto sulla qualificazione dell'intera attività "
    "e su cui si chiede il parere più urgente."))

# ══ 1. COME FUNZIONA ══
S.append(h1("1 · Come funziona la piattaforma (descrizione fattuale)"))
S.append(p(
    "Una cantina si registra, viene verificata da un amministratore e sottoscrive un contratto digitale. "
    "Crea poi un <b>certificato digitale</b> per una singola bottiglia fisica, identificata da numero di bottiglia, "
    "annata, denominazione e produttore, pagando alla piattaforma una commissione di emissione. "
    "La bottiglia <b>resta fisicamente presso la cantina</b>, che per contratto è tenuta a conservarla in condizioni "
    "controllate e ad assicurarla con polizza All Risks."))
S.append(p(
    "Un collezionista si registra, verifica l'email, fornisce nome, cognome, data di nascita, paese e codice "
    "identificativo fiscale (codice fiscale italiano, TIN dei paesi UE o ITIN statunitense, validati con algoritmo "
    "e confrontati con i dati anagrafici), dichiara di essere maggiorenne e accetta le condizioni. "
    "Può quindi acquistare, con carta di credito tramite Stripe, l'intero certificato oppure una percentuale di esso."))
S.append(p(
    "Chi possiede un certificato può proporlo ad altri collezionisti a un prezzo da lui indicato. Gli interessati "
    "inviano un'offerta; il proprietario la accetta o la rifiuta manualmente; solo dopo il pagamento la proprietà "
    "viene trasferita. Quando la cantina lo consente, chi possiede la totalità di un certificato può richiedere la "
    "<b>consegna fisica della bottiglia</b>: il certificato viene annullato e la bottiglia spedita."))
S.append(note(
    "Nota tecnica: i certificati sono attualmente registrati soltanto sul database della piattaforma. "
    "L'integrazione con la blockchain Polygon è sviluppata ma non attivata, e ogni riferimento pubblico a essa "
    "è stato rimosso dal sito in attesa della decisione."))

# ══ 2. DOMANDE ══
S.append(PageBreak())
S.append(h1("2 · Punti da sottoporre a parere"))

S.append(h2("A · Natura giuridica del certificato digitale"))
S.append(note("Stato: funzione attiva in produzione."))
for t in [
    "Come si qualifica il certificato digitale emesso dalla piattaforma: titolo rappresentativo di merce, documento di legittimazione, mero strumento probatorio del contratto, o altra figura?",
    "Il trasferimento del certificato è idoneo a trasferire la proprietà della bottiglia, o produce effetti soltanto obbligatori fra le parti?",
    "Il fatto che il certificato sia oggi registrato solo su database della piattaforma, e non su registro distribuito, incide sulla qualificazione o sull'opponibilità ai terzi?",
    "Se in futuro il certificato venisse registrato su blockchain pubblica, la qualificazione cambierebbe? Si applicherebbe il Regolamento MiCA?",
    "Il certificato può essere considerato un valore mobiliare o uno strumento finanziario in base alla disciplina vigente?",
]:
    S.append(q(t))

S.append(h2("B · Proprietà frazionata — punto prioritario"))
S.append(note("Stato: funzione attiva in produzione. Il mandato di progetto ne raccomanda la verifica preventiva."))
S.append(p(
    "Il funzionamento attuale: la cantina attribuisce alla bottiglia un valore complessivo; più collezionisti "
    "acquistano percentuali di quel valore; ogni acquirente riceve una quota espressa in percentuale. "
    "Le quote sono cedibili ad altri collezionisti. Chi arriva a possedere il 100% può chiedere la consegna fisica."))
for t in [
    "Come si qualifica la quota: comunione ordinaria sul bene ex art. 1100 c.c., diritto contrattuale di credito verso la cantina, diritto alla futura consegna, o altra figura?",
    "L'operazione può configurare una raccolta di capitale presso il pubblico, o un'offerta al pubblico di prodotti di investimento?",
    "Rileva la circostanza che l'acquirente della quota non possa godere materialmente del bene finché non ne acquisisce la totalità?",
    "La quota può essere qualificata come prodotto finanziario ai sensi dell'art. 1 TUF?",
    "Quali informazioni devono essere obbligatoriamente fornite all'acquirente prima del pagamento?",
    "Come si esercita, si trasferisce, si eredita e si estingue la quota? Cosa accade in caso di disaccordo fra co-titolari?",
    "Occorre modificare la funzione, sospenderla o corredarla di informativa specifica prima dell'apertura al pubblico?",
]:
    S.append(q(t))

S.append(h2("C · Trasferimento fra collezionisti"))
S.append(note("Stato: attivo. Prezzo libero, accettazione manuale, offerta minima pari al 20% del prezzo richiesto, nessun ordine automatico, nessun grafico di prezzo."))
for t in [
    "Il sistema di offerte e accettazioni può configurare un sistema multilaterale di negoziazione o un mercato organizzato?",
    "La piattaforma, che incassa i pagamenti e li ripartisce, assume la veste di intermediario? Con quali obblighi?",
    "È opportuno introdurre un periodo minimo fra acquisto e rivendita, o un limite al numero di operazioni per utente?",
    "La pubblicazione del prezzo richiesto da un privato comporta obblighi informativi ulteriori?",
]:
    S.append(q(t))

S.append(h2("D · Ruoli, custodia e responsabilità"))
S.append(note("Stato: la cantina produttrice è anche custode; non esiste ancora una figura di custode terzo."))
for t in [
    "Come si qualifica il rapporto di custodia fra cantina e collezionista: deposito ex art. 1766 c.c., o altro?",
    "Chi risponde di perdita, deterioramento o furto della bottiglia? La polizza All Risks richiesta per contratto è sufficiente e chi deve esserne beneficiario?",
    "Quali obblighi ricadono sulla piattaforma per il fatto di selezionare e verificare le cantine?",
    "In caso di insolvenza o cessazione della cantina, quale sorte hanno le bottiglie custodite e i certificati emessi?",
    "È necessario introdurre un custode terzo indipendente dal produttore?",
]:
    S.append(q(t))

S.append(PageBreak())

S.append(h2("E · Pagamenti e commissioni"))
S.append(note("Stato: attivo con Stripe (modalità test). Incassi ripartiti automaticamente fra piattaforma e cantina."))
S.append(tabella([
    ["Evento", "Commissione", "A carico di"],
    ["Emissione del certificato", "5% del valore della bottiglia", "Cantina"],
    ["Acquisto (prima vendita)", "7% aggiunto al prezzo", "Acquirente"],
    ["Cessione fra collezionisti", "7% acquirente + 3% cedente", "Entrambi"],
    ["Royalty alla cantina sulla cessione", "da 1% a 10%, scelta al momento dell'emissione", "Acquirente"],
    ["Riscatto della bottiglia fisica", "5% del valore + IVA 22% sulla commissione + spedizione", "Chi riscatta"],
], [W * 0.42, W * 0.36, W * 0.22]))
S.append(Spacer(1, 6))
for t in [
    "La ripartizione automatica degli incassi fra piattaforma e cantina configura prestazione di servizi di pagamento soggetta a autorizzazione, o rientra nell'esenzione dell'agente commerciale?",
    "Nelle cessioni fra collezionisti l'incasso transita oggi sull'account della cantina produttrice, e il venditore privato viene liquidato fuori piattaforma. È ammissibile? Quale struttura si raccomanda?",
    "Il trattamento IVA applicato al riscatto (IVA sulla sola commissione della piattaforma) è corretto? Qual è il trattamento della cessione fra privati?",
    "Le commissioni sono presentate all'acquirente in modo conforme alla disciplina consumeristica?",
]:
    S.append(q(t))

S.append(h2("F · Consegna del bene fisico"))
S.append(note("Stato: attivo. La cantina deve abilitare il riscatto; sui certificati frazionati serve il 100% delle quote."))
for t in [
    "L'annullamento del certificato alla consegna è la soluzione corretta, o è preferibile conservarlo con marcatura di avvenuto riscatto?",
    "La facoltà della cantina di non abilitare il ritiro è compatibile con i diritti dell'acquirente? Va previsto un termine massimo?",
    "Quali obblighi sorgono per il trasporto di bevande alcoliche, anche transfrontaliero (accise, documenti di accompagnamento)?",
    "Il diritto di recesso del consumatore come si applica all'acquisto del certificato e alla successiva consegna?",
]:
    S.append(q(t))

S.append(h2("G · Identificazione della clientela"))
S.append(note("Stato: attivo. Raccolti nome, cognome, data di nascita, paese e codice fiscale/TIN/ITIN di 28 paesi; verifica della maggiore età; nessuna verifica documentale."))
for t in [
    "L'attività rientra fra i soggetti obbligati alla normativa antiriciclaggio? In quale misura?",
    "Il livello di identificazione attuale è adeguato, o occorre verifica documentale e riscontro dell'identità?",
    "Vanno introdotte soglie di operatività, segnalazione di operazioni sospette o conservazione dedicata?",
    "La vendita di alcolici richiede verifiche dell'età ulteriori rispetto all'autodichiarazione?",
]:
    S.append(q(t))

S.append(h2("H · Comunicazione commerciale"))
S.append(note("Stato: rimossi da tutta la piattaforma i termini investimento, rendimento, performance e portafoglio, e ogni riferimento alla MiFID II."))
S.append(p("Formulazione oggi presente nel footer di ogni pagina, nelle email e nei Termini, da validare:"))
S.append(panel(
    "«Wine Bank 24 è progettata come piattaforma per il collezionismo e la compravendita di bottiglie fisiche. "
    "Non offre consulenza finanziaria, rendimenti, interessi o garanzie di rivalutazione.»"))
S.append(Spacer(1, 4))
S.append(p("Dichiarazione richiesta all'acquirente al momento dell'acquisto, da validare:"))
S.append(panel(
    "«Acquisto il certificato digitale esclusivamente come bene da collezione, per interesse collezionistico e non "
    "con finalità di rendimento. Sono consapevole che il valore dei beni da collezione può variare e che la "
    "piattaforma non offre garanzie di rivalutazione.»"))
S.append(Spacer(1, 6))
for t in [
    "Le due formulazioni sono adeguate e sufficienti? Si raccomandano modifiche?",
    "È opportuno reintrodurre un riferimento espresso alla non applicabilità di normative finanziarie, o è preferibile astenersi?",
    "Quali claim vanno evitati nella comunicazione promozionale e nei contenuti editoriali?",
]:
    S.append(q(t))

S.append(h2("I · Successione e vicende personali"))
S.append(note("Stato: non previsto dal software."))
for t in [
    "Cosa accade al certificato e alle quote in caso di decesso del titolare? Come procedono gli eredi?",
    "Come gestire un titolare che perde la capacità di agire, o un account cancellato con certificati attivi?",
]:
    S.append(q(t))

S.append(PageBreak())

# ══ 3. MATRICE ══
S.append(h1("3 · Matrice dei rischi da validare"))
S.append(p("Classificazione redatta dal team tecnico secondo il mandato di progetto. Si chiede conferma o revisione della gravità attribuita."))
S.append(tabella([
    ["Funzione", "Rischio individuato", "Gravità", "Stato attuale"],
    ["Proprietà frazionata", "Qualificazione come prodotto di investimento o raccolta di capitale", "Bloccante", "Attiva in produzione"],
    ["Trasferimento fra collezionisti", "Configurazione di mercato organizzato o intermediazione", "Alta", "Attivo"],
    ["Formazione del prezzo", "Prezzo libero senza stima indipendente", "Alta", "Attivo"],
    ["Certificato digitale", "Qualificazione del titolo e rapporto con la proprietà civilistica", "Alta", "Attivo"],
    ["Identificazione clientela", "Adeguatezza rispetto agli obblighi antiriciclaggio", "Alta", "Attivo"],
    ["Ripartizione dei pagamenti", "Prestazione di servizi di pagamento", "Media", "Attivo (modalità test)"],
    ["Custodia e assicurazione", "Responsabilità per perdita o danno del bene", "Media", "Attivo"],
    ["Diritto di consegna", "Condizioni di riscatto e recesso del consumatore", "Media", "Attivo"],
    ["Successione", "Trasmissione mortis causa non disciplinata", "Media", "Non previsto"],
    ["Registrazione su blockchain", "Applicabilità del Regolamento MiCA", "Media", "Sviluppata, non attivata"],
], [W * 0.26, W * 0.40, W * 0.14, W * 0.20]))

# ══ 4. NON IMPLEMENTATE ══
S.append(h1("4 · Funzioni volutamente non implementate"))
S.append(p(
    "Su indicazione del mandato di progetto le seguenti funzioni non sono state sviluppate, in quanto potenzialmente "
    "idonee a modificare la qualificazione dell'attività. Si chiede conferma che debbano restare escluse:"))
S.append(tabella([
    ["Ambito", "Funzioni escluse"],
    ["Remunerazione", "Rendimenti, interessi, dividendi, distribuzioni, depositi remunerati, reinvestimento automatico"],
    ["Operatività finanziaria", "Staking, prestito, leva, derivati, opzioni, acquisto a margine, ordini automatici"],
    ["Garanzie", "Riacquisto garantito, prezzo minimo, liquidità garantita, market making"],
    ["Rappresentazione", "Grafici di andamento del prezzo, book ordini, indicatori di rendimento o volatilità"],
    ["Consulenza", "Raccomandazioni personalizzate, portafogli gestiti, profilazione di rischio finanziario, rating"],
], [W * 0.24, W * 0.76]))

# ══ 5. INFORMAZIONI TECNICHE ══
S.append(h1("5 · Informazioni utili per la valutazione"))
S.append(tabella([
    ["Elemento", "Situazione"],
    ["Sede dei dati", "Database e archivio immagini presso fornitori con server nell'Unione Europea"],
    ["Fornitori esterni", "Stripe (pagamenti), Supabase (database), Vercel (hosting), Cloudflare (immagini), Brevo (email)"],
    ["Dati personali raccolti", "Nome, cognome, data di nascita, paese, codice fiscale o equivalente estero, indirizzo di spedizione"],
    ["Cancellazione account", "Implementata come anonimizzazione, con conservazione decennale dei soli dati contabili"],
    ["Contratto cantina", "Sottoscritto in piattaforma con registrazione di data e indirizzo IP; prevede vincolo di indisponibilità del bene, polizza All Risks e accesso ispettivo"],
    ["Dati societari", "Non ancora completi: la piattaforma non accetta pagamenti reali finché non lo saranno"],
], [W * 0.26, W * 0.74]))

S.append(Spacer(1, 12))
S.append(panel(
    "<b>Documenti allegabili su richiesta:</b> testo integrale dei Termini e Condizioni, informativa privacy, "
    "contratto cantina, schermate del percorso di acquisto e di riscatto, struttura del database.",
    st_body))

doc.build(S, onFirstPage=footer, onLaterPages=footer)
print(f"PDF generato: {OUTPUT}")
