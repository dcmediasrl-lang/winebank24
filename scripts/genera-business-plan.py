#!/usr/bin/env python3
# Genera il Business Plan PDF di Wine Bank 24 (A4 stampabile).
# Uso: python3 scripts/genera-business-plan.py
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
)

OUTPUT = "/Users/melissa/Documents/Wine Bank 24 — Business Plan.pdf"

WINE = colors.HexColor("#A21C19")
DARK = colors.HexColor("#13110C")
GREY = colors.HexColor("#555555")
LIGHT = colors.HexColor("#F7F2F2")

st_title = ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=22, textColor=DARK, spaceAfter=4)
st_sub = ParagraphStyle("s", fontName="Helvetica", fontSize=10, textColor=GREY, spaceAfter=18)
st_h1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=13, textColor=WINE, spaceBefore=16, spaceAfter=8)
st_h2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=10.5, textColor=DARK, spaceBefore=10, spaceAfter=4)
st_body = ParagraphStyle("b", fontName="Helvetica", fontSize=9.5, leading=13.5, textColor=DARK, alignment=TA_JUSTIFY, spaceAfter=6)
st_note = ParagraphStyle("n", fontName="Helvetica-Oblique", fontSize=8, leading=11, textColor=GREY, spaceBefore=6)
st_cell = ParagraphStyle("c", fontName="Helvetica", fontSize=8.5, leading=11, textColor=DARK)
st_cellb = ParagraphStyle("cb", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=DARK)

def tbl(data, widths, header=True, highlight_last=False):
    rows = [[Paragraph(c, st_cellb if (header and i == 0) else st_cell) for c in row] for i, row in enumerate(data)]
    t = Table(rows, colWidths=widths, repeatRows=1 if header else 0)
    style = [
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CCCCCC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]
    if header:
        style += [("BACKGROUND", (0, 0), (-1, 0), WINE),
                  ("TEXTCOLOR", (0, 0), (-1, 0), colors.white)]
        rows[0] = [Paragraph(f'<font color="white"><b>{c}</b></font>', st_cell) for c in data[0]]
        t = Table(rows, colWidths=widths, repeatRows=1)
    if highlight_last:
        style.append(("BACKGROUND", (0, -1), (-1, -1), LIGHT))
    t.setStyle(TableStyle(style))
    return t

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(GREY)
    canvas.setFont("Helvetica", 7)
    canvas.drawString(20*mm, 12*mm, "Wine Bank 24 — Business Plan · Luglio 2026 · Riservato")
    canvas.drawRightString(190*mm, 12*mm, f"Pagina {doc.page}")
    canvas.setStrokeColor(WINE)
    canvas.setLineWidth(0.5)
    canvas.line(20*mm, 15*mm, 190*mm, 15*mm)
    canvas.restoreState()

doc = SimpleDocTemplate(OUTPUT, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=18*mm, bottomMargin=22*mm,
                        title="Wine Bank 24 — Business Plan", author="Wine Bank 24")
S = []
W = 170*mm

# ═══ COPERTINA / EXECUTIVE SUMMARY ═══
S.append(Paragraph("Wine Bank 24", st_title))
S.append(Paragraph("Business Plan — Piattaforma di collezionismo digitale per vini pregiati · app.winebank24.eu · Luglio 2026", st_sub))

S.append(Paragraph("Executive Summary", st_h1))
S.append(Paragraph(
    "Wine Bank 24 è un marketplace che trasforma bottiglie di vino pregiato in certificati digitali (NFT). "
    "Le cantine mintano e vendono i certificati; i collezionisti li acquistano, li scambiano e — quando la cantina "
    "lo abilita — riscattano la bottiglia fisica. La bottiglia resta custodita e assicurata in cantina: la piattaforma "
    "monetizza ogni passaggio (emissione, vendita, rivendita, riscatto) senza mai gestire logistica di magazzino. "
    "Il posizionamento è esclusivamente da <b>collezionismo</b>: nessuna promessa di rendimento, nessun profilo MiFID II.", st_body))
S.append(Paragraph(
    "La piattaforma è <b>già sviluppata e in produzione</b>: pagamenti Stripe end-to-end, KYC internazionale su 28 paesi "
    "(codice fiscale IT, TIN UE, ITIN USA) con verifica anagrafica incrociata, co-proprietà frazionata, sistema di offerte "
    "con trasferimento a pagamento avvenuto, integrazione blockchain Polygon pronta all'attivazione.", st_body))

S.append(Paragraph("Modello di ricavi (commissioni in vigore)", st_h1))
S.append(tbl([
    ["Evento", "Fee", "Chi paga", "Note"],
    ["Mint del certificato", "5% del valore", "Cantina", "Una tantum per bottiglia emessa"],
    ["Acquisto (primario)", "7% sopra il prezzo", "Acquirente", "Il venditore riceve il prezzo pieno"],
    ["Vendita secondaria", "7% acquirente + 3% venditore", "Entrambi", "+ royalty cantina 1–10% (all'acquirente)"],
    ["Riscatto bottiglia", "5% del valore", "Chi riscatta", "+ IVA e spedizione (alla cantina)"],
], [W*0.24, W*0.24, W*0.16, W*0.36]))
S.append(Paragraph(
    "Margine netto piattaforma dopo i costi Stripe (~1,5% + €0,25 sull'intero transato): "
    "<b>~5,3% del prezzo su vendita primaria, ~8,2% su secondaria</b>, oltre al mint (4,8% netto) e al riscatto. "
    "Take rate netto blended stimato: <b>~7% del transato annuo</b>.", st_body))

S.append(Paragraph("1 · Struttura dei costi", st_h1))
S.append(Paragraph("Costi di avviamento (una tantum)", st_h2))
S.append(tbl([
    ["Voce", "Importo"],
    ["Avvocato specializzato fintech/crypto — parere MiCA/MiFID II, T&C, GDPR, contrattualistica cantine", "€ 10.000"],
    ["Adeguamenti societari, registri, assicurazione RC iniziale", "€ 2.000"],
    ["Deploy smart contract su Polygon + audit di sicurezza", "€ 3.000"],
    ["<b>Totale avviamento</b>", "<b>€ 15.000</b>"],
], [W*0.8, W*0.2], highlight_last=True))
S.append(Paragraph("Costi operativi ricorrenti (anno)", st_h2))
S.append(tbl([
    ["Voce", "Importo/anno"],
    ["Infrastruttura tecnologica (hosting Vercel, database Supabase, storage R2, email, dominio)", "€ 1.500"],
    ["Gas fee blockchain Polygon (mint e burn: costo per transazione inferiore a €0,01)", "€ 100"],
    ["Manutenzione evolutiva del software", "€ 6.000"],
    ["Avvocato — retainer per aggiornamenti normativi", "€ 3.000"],
    ["Commercialista — contabilità, IVA, bilancio", "€ 4.000"],
    ["Marketing e sponsorizzazioni (advertising, fiere di settore, partnership con cantine)", "€ 24.000"],
    ["Assicurazioni e spese generali", "€ 2.000"],
    ["<b>Totale ricorrente</b>", "<b>≈ € 40.000</b>"],
], [W*0.8, W*0.2], highlight_last=True))
S.append(Paragraph(
    "Nota: la scelta di appoggiarsi a Polygon anziché sviluppare una blockchain proprietaria elimina un costo "
    "stimabile in decine di migliaia di euro l'anno (validatori, sicurezza, personale specializzato) e garantisce "
    "verificabilità pubblica dei certificati.", st_note))

S.append(PageBreak())

# ═══ PAGINA 2: unit economics + BEP ═══
S.append(Paragraph("2 · Unit economics — bottiglia tipo da € 300", st_h1))
S.append(tbl([
    ["Evento", "Incasso lordo piattaforma", "Costo Stripe", "Netto piattaforma"],
    ["Mint (cantina)", "€ 15,00 (5%)", "≈ € 0,50", "≈ € 14,50"],
    ["Vendita primaria (7%)", "€ 21,00", "≈ € 5,10", "≈ € 15,90 (5,3%)"],
    ["Vendita secondaria (7% + 3%)", "€ 30,00", "≈ € 5,30", "≈ € 24,70 (8,2%)"],
    ["Riscatto (5% + IVA + sped.)", "€ 15,00", "≈ € 0,75", "≈ € 14,25"],
], [W*0.32, W*0.24, W*0.18, W*0.26]))
S.append(Paragraph(
    "Una bottiglia da €300 che percorre l'intero ciclo di vita (mint → vendita primaria → una rivendita → riscatto) "
    "genera per la piattaforma <b>~€69 netti, il 23% del valore del bene</b>, distribuiti su più esercizi.", st_body))

S.append(Paragraph("3 · Break-even point", st_h1))
S.append(Paragraph(
    "Con costi ricorrenti di €40.000/anno e un ricavo netto medio di ~€30 per bottiglia venduta nel primo passaggio "
    "(mint + vendita primaria), il pareggio operativo richiede:", st_body))
S.append(tbl([
    ["Indicatore", "Valore"],
    ["Bottiglie vendute / anno", "≈ 1.350"],
    ["Bottiglie vendute / mese", "≈ 110"],
    ["Transato annuo (GMV)", "≈ € 400.000 – 450.000"],
    ["Cantine attive necessarie (6–7 bottiglie/mese ciascuna)", "≈ 18 – 20"],
    ["<b>Orizzonte temporale realistico</b>", "<b>15° – 24° mese di attività</b>"],
], [W*0.6, W*0.4], highlight_last=True))
S.append(Paragraph(
    "Con le commissioni precedenti (2,5% solo lato acquirente) il pareggio avrebbe richiesto oltre €2,5M di transato: "
    "l'adeguamento a 7% + 3% lo rende raggiungibile entro il secondo anno.", st_body))

S.append(Paragraph("4 · Previsioni economiche a 2 · 5 · 10 anni (scenario base)", st_h1))
S.append(tbl([
    ["", "Anno 2", "Anno 5", "Anno 10"],
    ["Cantine attive", "20", "70", "180"],
    ["Bottiglie vendute/anno", "1.500", "12.000", "45.000"],
    ["Prezzo medio bottiglia", "€ 280", "€ 350", "€ 420"],
    ["<b>Transato (GMV)</b>", "<b>€ 420.000</b>", "<b>€ 4,2 M</b>", "<b>€ 18,9 M</b>"],
    ["Ricavi netti piattaforma (~7% take rate)", "€ 29.000", "€ 295.000", "€ 1.320.000"],
    ["Costi operativi (crescenti con la scala)", "€ 55.000", "€ 180.000", "€ 550.000"],
    ["<b>Risultato operativo</b>", "<b>− € 26.000</b>", "<b>+ € 115.000</b>", "<b>+ € 770.000</b>"],
], [W*0.34, W*0.22, W*0.22, W*0.22], highlight_last=True))
S.append(Paragraph(
    "Scenario prudente (volumi dimezzati): pareggio all'anno 4, utile anno 10 ≈ €350.000. "
    "Scenario espansivo (penetrazione reale nei mercati UE, già supportati dal KYC a 28 paesi): "
    "ricavi anno 10 oltre €2M. Il fabbisogno di capitale per coprire avviamento e cash burn fino al pareggio "
    "è stimato in <b>€ 100.000 – 120.000</b>.", st_body))

S.append(PageBreak())

# ═══ PAGINA 3: leve, rischi, disclaimer ═══
S.append(Paragraph("5 · Leve di crescita", st_h1))
S.append(Paragraph(
    "<b>1. Canone annuo cantine (€200–500):</b> trasformerebbe parte dei ricavi da variabili a ricorrenti, "
    "profilo molto apprezzato da eventuali investitori. Con 70 cantine all'anno 5: +€25.000 stabili.<br/><br/>"
    "<b>2. Espansione UE:</b> la piattaforma è già bilingue e supporta l'identificazione fiscale di tutti i paesi UE. "
    "Il mercato del fine wine europeo vale >€1 miliardo annuo nel solo segmento collezionismo.<br/><br/>"
    "<b>3. Attivazione blockchain Polygon:</b> già pronta nel codice; rafforza il valore percepito del certificato "
    "(verificabilità pubblica su PolygonScan) a costo marginale quasi nullo.<br/><br/>"
    "<b>4. Servizi premium:</b> valutazioni, report di collezione, eventi degustazione riservati ai titolari di certificati.", st_body))

S.append(Paragraph("6 · Rischi principali e mitigazioni", st_h1))
S.append(tbl([
    ["Rischio", "Mitigazione"],
    ["Regolamentare (qualificazione NFT, MiCA)", "Posizionamento da puro collezionismo, disclaimer in ogni acquisto, parere legale specializzato, monitoraggio normativo continuo"],
    ["Adozione lenta delle cantine", "Onboarding assistito, mint fee eventualmente scontata per le prime cantine, partnership con consorzi"],
    ["Concentrazione incassi Stripe Connect", "Definire prima del lancio la procedura di payout ai venditori privati sulle vendite secondarie"],
    ["Custodia fisica (danni, frodi)", "Polizza assicurativa All Risks obbligatoria per le cantine, ispezioni con preavviso 48h"],
    ["Fiscale (IVA su commissioni e riscatti)", "Validazione preventiva del commercialista sul regime dei beni da collezione"],
], [W*0.35, W*0.65]))

S.append(Paragraph("7 · Stato del progetto e prossimi passi", st_h1))
S.append(tbl([
    ["Elemento", "Stato"],
    ["Piattaforma (marketplace, pagamenti, KYC, offerte, riscatto)", "✔ In produzione"],
    ["Commissioni adeguate al piano (7% + 3% + mint 5% + riscatto 5%)", "✔ Attive"],
    ["Blockchain Polygon", "Pronta — da attivare (wallet + deploy contratto)"],
    ["Payout venditori privati su secondario", "Da definire (Stripe Connect o procedura manuale)"],
    ["P.IVA, publisher AdSense", "Da completare"],
    ["Validazione fiscale IVA riscatto", "Da confermare con il commercialista"],
], [W*0.65, W*0.35]))

S.append(Spacer(1, 10))
S.append(Paragraph(
    "Avvertenza: il presente documento è una proiezione basata su ipotesi di mercato e sui dati operativi della "
    "piattaforma alla data di redazione. Non costituisce consulenza fiscale, legale o d'investimento. Le stime vanno "
    "validate con i professionisti incaricati (commercialista e legale) prima di qualsiasi decisione.", st_note))

doc.build(S, onFirstPage=footer, onLaterPages=footer)
print(f"PDF generato: {OUTPUT}")
