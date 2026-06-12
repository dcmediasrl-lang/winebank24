import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { CONTRACT_CANTINA_VERSION } from "./contracts";

const WINE_RED = rgb(0.6, 0.13, 0.0);
const BLACK = rgb(0.1, 0.05, 0.05);
const GRAY = rgb(0.45, 0.42, 0.42);
const WHITE = rgb(1, 1, 1);

function wrapText(text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawSection(
  page: PDFPage,
  bold: PDFFont,
  regular: PDFFont,
  title: string,
  body: string[],
  y: number,
  width: number,
  margin: number,
): number {
  const contentWidth = width - margin * 2;

  // Section header background
  page.drawRectangle({ x: margin, y: y - 20, width: contentWidth, height: 20, color: WINE_RED });
  page.drawText(title, { x: margin + 8, y: y - 14, size: 9, font: bold, color: WHITE });
  y -= 28;

  for (const para of body) {
    const lines = wrapText(para, regular, 8.5, contentWidth - 8);
    for (const line of lines) {
      if (y < 60) return y; // caller handles page break
      page.drawText(line, { x: margin + 8, y, size: 8.5, font: regular, color: BLACK });
      y -= 13;
    }
    y -= 4; // paragraph spacing
  }

  return y - 8;
}

export async function generateContractPdf(cantinaName: string, contactEmail: string, acceptedAt: Date): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const italicFont = await doc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header bar
  page.drawRectangle({ x: 0, y: pageHeight - 70, width: pageWidth, height: 70, color: WINE_RED });
  page.drawText("WINE BANK 24", { x: margin, y: pageHeight - 28, size: 18, font: boldFont, color: WHITE });
  page.drawText("Contratto Creator — Piattaforma di Collezionismo Digitale", { x: margin, y: pageHeight - 46, size: 9, font: regularFont, color: rgb(1, 0.85, 0.7) });
  page.drawText(`Versione ${CONTRACT_CANTINA_VERSION}`, { x: margin, y: pageHeight - 62, size: 8, font: italicFont, color: rgb(1, 0.85, 0.7) });

  y = pageHeight - 90;

  // Contractor info box
  page.drawRectangle({ x: margin, y: y - 54, width: contentWidth, height: 54, color: rgb(0.96, 0.93, 0.9), borderColor: WINE_RED, borderWidth: 0.5 });
  page.drawText("PARTI DEL CONTRATTO", { x: margin + 10, y: y - 14, size: 8, font: boldFont, color: WINE_RED });
  page.drawText(`Creator: ${cantinaName}`, { x: margin + 10, y: y - 28, size: 9, font: regularFont, color: BLACK });
  page.drawText(`Email: ${contactEmail}`, { x: margin + 10, y: y - 40, size: 9, font: regularFont, color: BLACK });
  page.drawText("Piattaforma: Wine Bank 24 (DC Media S.R.L.)", { x: margin + 10, y: y - 52, size: 9, font: regularFont, color: BLACK });
  y -= 68;

  const dateStr = acceptedAt.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = acceptedAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  page.drawText(`Data accettazione: ${dateStr} alle ${timeStr} (UTC)`, { x: margin, y, size: 8.5, font: italicFont, color: GRAY });
  y -= 20;

  // Helper to add new page if needed
  function ensureSpace(needed: number) {
    if (y - needed < 60) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  }

  const sections: Array<{ title: string; body: string[] }> = [
    {
      title: "NATURA GIURIDICA DEL RAPPORTO",
      body: [
        "Il presente contratto ha natura di: (1) Custodia qualificata — il Creator si obbliga a custodire il bene fisico (bottiglia) in conformità agli standard stabiliti dalla Piattaforma, assumendo le responsabilità di un depositario professionale ai sensi degli artt. 1766 ss. c.c.",
        "(2) Mandato con rappresentanza limitata — la Piattaforma agisce come intermediario tecnico per conto del Creator nella gestione dei certificati digitali, nei limiti espressamente previsti dal presente contratto.",
        "(3) Vincolo di indisponibilità del bene — dal momento dell'iscrizione del certificato digitale nella piattaforma, il bene fisico sottostante è gravato da un vincolo contrattuale di indisponibilità fino al completamento della procedura di liquidazione.",
      ],
    },
    {
      title: "A.1 — IDENTIFICAZIONE DEL BENE",
      body: [
        "Ogni bene fisico (bottiglia) oggetto di certificazione digitale deve essere identificato in modo univoco e non ambiguo attraverso il form di inserimento prodotto, con indicazione obbligatoria di: nome del vino, denominazione di origine e annata; numero di bottiglia/lotto seriale univoco; cantina di custodia certificata (indirizzo fisico); fotografia della bottiglia fisica (elemento obbligatorio, non derogabile); descrizione delle condizioni di conservazione.",
      ],
    },
    {
      title: "A.2 — VINCOLO DI INDISPONIBILITÀ DEL BENE",
      body: [
        "Dal momento dell'emissione del certificato digitale e fino al completamento della procedura di liquidazione, il Creator NON PUÒ: vendere la bottiglia fisica; spostare o trasferire il bene; dare il bene in pegno o in garanzia; cedere a qualsiasi titolo il bene; modificare le condizioni di custodia senza autorizzazione; aprire o consumare la bottiglia.",
        "Qualsiasi atto dispositivo sul bene fisico in violazione del presente vincolo è inefficace nei confronti della Piattaforma e dei titolari di certificati digitali, e costituisce inadempimento grave.",
      ],
    },
    {
      title: "A.3 — OBBLIGHI DI CUSTODIA",
      body: [
        "Il Creator si obbliga a: conservare il bene a temperatura 10–16°C, umidità 60–80%, assenza di vibrazioni e luce diretta, posizione orizzontale, conformità alle norme UNI EN ISO 9000.",
        "Assicurazione obbligatoria: polizza All Risks per il valore totale dei beni certificati, con la Piattaforma e i titolari di certificati come beneficiari. La polizza deve essere presentata entro 30 giorni dall'iscrizione e rinnovata annualmente.",
        "Audit annuale: il Creator si sottopone a verifica annuale dello stato di conservazione dei beni, condotta da ispettore accreditato dalla Piattaforma, a proprie spese.",
        "Accesso ispettivo: la Piattaforma ha diritto di accesso ispettivo con preavviso di 48 ore. In caso di emergenza, l'accesso è immediato.",
        "Notifica immediata: il Creator comunica alla Piattaforma entro 24 ore qualsiasi evento che possa pregiudicare lo stato di conservazione del bene.",
      ],
    },
    {
      title: "A.4 — CLAUSOLA DI LIQUIDAZIONE",
      body: [
        "La liquidazione del certificato digitale (ritiro fisico della bottiglia) è regolata dalla seguente procedura: (1) Il titolare del 100% presenta richiesta tramite piattaforma. (2) La Piattaforma notifica la richiesta al Creator entro 24 ore. (3) Il Creator ha 5 giorni lavorativi per confermare la disponibilità del bene. (4) La consegna avviene entro 15 giorni lavorativi, a spese del richiedente. (5) Al completamento della consegna, il certificato digitale viene invalidato.",
        "In caso di co-proprietà frazionata, la liquidazione è possibile solo previo accordo unanime di tutti i co-proprietari o riacquisto integrale.",
      ],
    },
    {
      title: "A.5 — CLAUSOLA PENALE",
      body: [
        "In caso di violazione del vincolo di indisponibilità, il Creator è soggetto a: (1) Penale del 200% del valore stimato del bene al momento dell'accertamento, dovuta immediatamente senza necessità di messa in mora. (2) Escussione immediata della polizza assicurativa. (3) Risoluzione immediata del contratto, sospensione dell'account, rimozione di tutti i certificati attivi, esclusione permanente dalla piattaforma.",
        "Le parti concordano che la penale è determinata in funzione preventiva e non costituisce liquidazione forfettaria del danno.",
      ],
    },
    {
      title: "A.6 — LEGGE APPLICABILE E FORO",
      body: [
        "Il presente contratto è regolato dalla legge italiana. Per qualsiasi controversia è competente in via esclusiva il Tribunale di Milano, salvo diversa disposizione di legge inderogabile.",
      ],
    },
  ];

  for (const section of sections) {
    const estimatedHeight = 22 + section.body.length * 40;
    ensureSpace(estimatedHeight);
    y = drawSection(page, boldFont, regularFont, section.title, section.body, y, pageWidth, margin);
  }

  // Signature block
  ensureSpace(100);
  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: WINE_RED });
  y -= 18;
  page.drawText("DICHIARAZIONI DI ACCETTAZIONE", { x: margin, y, size: 9, font: boldFont, color: WINE_RED });
  y -= 16;

  const declarations = [
    "* Ho letto integralmente il contratto e ne comprendo il contenuto.",
    "* Accetto il vincolo di indisponibilita' del bene fisico per tutta la durata della certificazione digitale.",
    "* Mi impegno a rispettare gli obblighi di custodia (conservazione, assicurazione, audit, accesso ispettivo).",
    "* Prendo atto della clausola penale del 200% e della risoluzione immediata per inadempimento.",
    "* Autorizzo Wine Bank 24 ad agire come mandatario con rappresentanza limitata.",
  ];

  for (const decl of declarations) {
    ensureSpace(16);
    page.drawText(decl, { x: margin, y, size: 8.5, font: regularFont, color: BLACK });
    y -= 14;
  }

  y -= 10;
  page.drawText(`Accettazione registrata il ${dateStr} alle ${timeStr} UTC`, { x: margin, y, size: 8, font: italicFont, color: GRAY });
  y -= 12;
  page.drawText(`Versione contratto: ${CONTRACT_CANTINA_VERSION} · Wine Bank 24 — ${APP_URL}`, { x: margin, y, size: 7.5, font: italicFont, color: GRAY });

  // Page numbers
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    pages[i].drawText(`Pagina ${i + 1} di ${pages.length}`, {
      x: pageWidth / 2 - 25,
      y: 20,
      size: 7.5,
      font: regularFont,
      color: GRAY,
    });
  }

  return doc.save();
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.winebank24.eu";
