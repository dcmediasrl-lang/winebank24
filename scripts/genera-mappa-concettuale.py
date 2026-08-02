#!/usr/bin/env python3
# Genera la mappa concettuale PDF di Wine Bank 24 (2 pagine A4).
# Uso: python3 scripts/genera-mappa-concettuale.py
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

OUTPUT = "/Users/melissa/Documents/Wine Bank 24 — Mappa Concettuale.pdf"

W, H = A4
M = 18 * mm

WINE = colors.HexColor("#A21C19")
DARK = colors.HexColor("#13110C")
ORANGE = colors.HexColor("#C47B1E")
WHITE = colors.white
BLACK = colors.black
BORDER_LIGHT = colors.HexColor("#DDDDDD")

def draw_header(c, page_label, subtitle_label):
    c.setFillColor(DARK)
    c.rect(0, H - 28*mm, W, 28*mm, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(M, H - 13*mm, "Wine Bank 24 — Mappa Concettuale")
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#CCCCCC"))
    c.drawString(M, H - 20*mm, "Piattaforma di collezionismo digitale per vini pregiati  ·  app.winebank24.eu  ·  Luglio 2026")
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(WINE)
    c.drawRightString(W - M, H - 11*mm, page_label)
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.HexColor("#AAAAAA"))
    c.drawRightString(W - M, H - 18*mm, subtitle_label)
    c.setStrokeColor(WINE)
    c.setLineWidth(2)
    c.line(M, H - 29*mm, W - M, H - 29*mm)

def section_title(c, text, y):
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(WINE)
    c.drawString(M, y, text.upper())
    c.setStrokeColor(WINE)
    c.setLineWidth(0.5)
    tw = c.stringWidth(text.upper(), "Helvetica-Bold", 9)
    c.line(M, y - 2, M + tw, y - 2)
    return y - 6*mm

def draw_footer(c, text):
    c.setFillColor(DARK)
    c.rect(0, 0, W, 10*mm, fill=1, stroke=0)
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.HexColor("#AAAAAA"))
    c.drawString(M, 3.5*mm, text)

def draw_badges(c, badges, y, border_col, fill_hex):
    bx, by = M, y - 1*mm
    c.setFont("Helvetica", 7.5)
    pad_h = 4
    for badge in badges:
        bw = c.stringWidth(badge, "Helvetica", 7.5) + 2 * pad_h
        if bx + bw > W - M:
            bx = M
            by -= 6*mm
        c.setStrokeColor(border_col)
        c.setFillColor(colors.HexColor(fill_hex))
        c.setLineWidth(0.7)
        c.roundRect(bx, by - 3, bw, 4.5*mm, 2, fill=1, stroke=1)
        c.setFillColor(DARK)
        c.drawString(bx + pad_h, by + 0.5, badge)
        bx += bw + 5
    return by

def draw_page1(c):
    draw_header(c, "PAGINA 1 / 2", "Stack · Attori · Flussi")
    y = H - 35*mm

    y = section_title(c, "Stack Tecnologico", y)
    badges = [
        "Next.js 16 App Router", "TypeScript", "React 19", "NextAuth v5 JWT", "Prisma 7",
        "PostgreSQL Supabase", "Stripe Checkout + Connect", "Cloudflare R2", "Vercel",
        "Google Analytics GA4", "i18n IT/EN", "Polygon (pronta, da attivare)",
    ]
    by = draw_badges(c, badges, y, WINE, "#FFF8F8")
    y = by - 8*mm

    y = section_title(c, "Attori del Sistema", y)
    actors = [
        ("ADMIN", BLACK, [
            "Gestione utenti e ruoli",
            "Approvazione e verifica cantine",
            "Monitoraggio NFT piattaforma",
            "Gestione blog generale",
            "Wine DB — denominazioni DOC/DOCG",
            "Transazioni e configurazione fee",
            "Approvazione richieste burn NFT",
        ]),
        ("CANTINA", WINE, [
            "Mint NFT bottiglie (con fee)",
            "Pubblica NFT nel marketplace",
            "Collezioni e contratto digitale",
            "Assicurazione e profilo pubblico",
            "Offerte ricevute, blog, report",
            "Stripe Connect per incassi",
            "Abilita riscatto bottiglia (+ spedizione)",
            "Collezione: NFT di altri produttori",
        ]),
        ("COLLEZIONISTA", ORANGE, [
            "Profilo obbligatorio: KYC + 18+ + T&C",
            "Codice fiscale / TIN UE / ITIN USA",
            "Acquisto NFT e quote via Stripe",
            "Vendita secondaria e offerte",
            "Wishlist, preferiti, storico",
            "Riscatto bottiglia (se abilitato)",
            "Liquidazione co-proprietari",
        ]),
    ]
    col_w = (W - 2 * M - 8*mm) / 3
    col_h = 52*mm
    for i, (title, border_col, items) in enumerate(actors):
        cx = M + i * (col_w + 4*mm)
        cy = y - col_h
        c.setStrokeColor(border_col)
        c.setFillColor(colors.HexColor("#FAFAFA"))
        c.setLineWidth(1.5)
        c.rect(cx, cy, col_w, col_h, fill=1, stroke=1)
        c.setFillColor(border_col)
        c.rect(cx, cy + col_h - 7*mm, col_w, 7*mm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawCentredString(cx + col_w/2, cy + col_h - 4.8*mm, title)
        c.setFont("Helvetica", 7)
        c.setFillColor(DARK)
        iy = cy + col_h - 11*mm
        for item in items:
            c.drawString(cx + 4, iy, "→  " + item)
            iy -= 5.3*mm
    y -= col_h + 8*mm

    y = section_title(c, "Flussi Operativi — ogni trasferimento passa da Stripe", y)
    flows = [
        ("① VENDITA PRIMARIA",
         "Cantina → Mint (fee) → Pubblica → Marketplace → Collezionista paga (prezzo + commissione) → Webhook → Proprietà"),
        ("② VENDITA SECONDARIA / OFFERTE",
         "Offerta → Venditore accetta → In attesa di pagamento → Acquirente paga su Stripe → Webhook → Trasferimento + royalty cantina"),
        ("③ CO-PROPRIETÀ (NFT FRAZIONATI)",
         "Acquisto quote dalla cantina o tra collezionisti → sempre via Stripe → fusione automatica quote stesso proprietario"),
        ("④ RISCATTO BOTTIGLIA FISICA",
         "Cantina abilita → (frazionati: 100% quote) → Paga fee 5% + IVA + spedizione → Admin approva → Burn NFT → Consegna"),
        ("⑤ REGISTRAZIONE",
         "Email + password → Verifica email → Profilo: nome · data nascita · paese · codice ID verificato → 18+ → T&C → Accesso"),
    ]
    for label, flow in flows:
        c.setFillColor(colors.HexColor("#FDF5F5"))
        c.setStrokeColor(colors.HexColor("#E8D0CF"))
        c.setLineWidth(0.5)
        c.rect(M, y - 10*mm, W - 2*M, 10*mm, fill=1, stroke=1)
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(WINE)
        c.drawString(M + 4, y - 3.5*mm, label)
        c.setFont("Helvetica", 7)
        c.setFillColor(DARK)
        c.drawString(M + 4, y - 7.5*mm, flow)
        y -= 11*mm

    draw_footer(c, "Wine Bank 24  ·  app.winebank24.eu  ·  Luglio 2026  |  Pagina 1 di 2")

def draw_page2(c):
    c.showPage()
    draw_header(c, "PAGINA 2 / 2", "Funzionalità · Regole · Database · Stato")
    y = H - 35*mm

    y = section_title(c, "Funzionalità Sviluppate", y)
    features = [
        ("Identità & Sicurezza", [
            "Login email+password, rate limiting, 2FA",
            "Google login solo per utenti già registrati",
            "Blocco account dopo 5 tentativi (30 min)",
            "Profilo obbligatorio al primo accesso",
            "Codici ID di 28 paesi (IT, UE, USA):",
            "  formato + checksum + incrocio anagrafico",
            "Un codice = un solo account (vincolo DB)",
            "Verifica 18+ client e server",
            "Ruoli ADMIN / CANTINA / COLLECTOR",
            "Activity log su ogni azione",
        ]),
        ("Pagamenti & Marketplace", [
            "Stripe Checkout per ogni acquisto",
            "Stripe Connect: split automatico incassi",
            "Commissione piattaforma sopra il prezzo",
            "Royalty cantina su vendite secondarie",
            "Offerte: trasferimento solo dopo pagamento",
            "Webhook idempotente (eventi duplicati)",
            "Protezione doppia vendita",
            "NFT frazionabili con quote acquistabili",
            "Marketplace con filtri e ricerca",
        ]),
        ("Riscatto & Custodia", [
            "Bottiglia custodita sempre in cantina",
            "Riscatto solo se la cantina lo abilita",
            "Costo: fee 5% + IVA 22% + spedizione",
            "Fee alla piattaforma, resto alla cantina",
            "Frazionati: serve il 100% delle quote",
            "  (liquidazione co-proprietari via offerte)",
            "Approvazione admin → burn del certificato",
            "Burn on-chain pronto (quando attivata)",
        ]),
        ("Contenuti & Infrastruttura", [
            "i18n completo italiano / inglese",
            "Blog piattaforma + blog per cantina",
            "Email transazionali (verifica, acquisti...)",
            "Contratto cantina in PDF con firma",
            "Upload immagini su Cloudflare R2",
            "Immagini ottimizzate (next/image)",
            "Google Analytics GA4",
            "Deploy Vercel · favicon · SEO title",
        ]),
    ]
    box_w = (W - 2 * M - 5*mm) / 2
    box_h = 58*mm
    positions = [
        (M, y - box_h), (M + box_w + 5*mm, y - box_h),
        (M, y - 2 * box_h - 5*mm), (M + box_w + 5*mm, y - 2 * box_h - 5*mm),
    ]
    for i, (title, items) in enumerate(features):
        bx, by = positions[i]
        c.setStrokeColor(BORDER_LIGHT)
        c.setFillColor(WHITE)
        c.setLineWidth(0.5)
        c.rect(bx, by, box_w, box_h, fill=1, stroke=1)
        c.setFillColor(WINE)
        c.rect(bx, by + box_h - 1.5, box_w, 1.5, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(WINE)
        c.drawString(bx + 5, by + box_h - 5.5*mm, title)
        c.setFont("Helvetica", 6.8)
        c.setFillColor(DARK)
        iy = by + box_h - 10*mm
        for item in items:
            if iy < by + 2:
                break
            prefix = "" if item.startswith("  ") else "•  "
            c.drawString(bx + 5, iy, prefix + item)
            iy -= 4.8*mm
    y -= 2 * box_h + 13*mm

    y = section_title(c, "Modelli Database Principali — PostgreSQL · Supabase", y)
    models = [
        ("User", ["id · email · role", "firstName · lastName", "birthDate · country", "fiscalCode (unico)", "password · 2FA", "emailVerified · isBlocked"]),
        ("Nft", ["id · name · status", "price · totalValue", "cantinaId · ownerId", "isFractionable", "physicalDeliveryUnlocked", "tokenId · txHash"]),
        ("NftFraction / Offer", ["percentage · investedAmount", "isListed · askingPrice", "offer: PENDING → ACCEPTED", "  → COMPLETED (pagata)", "buyerId · sellerId"]),
        ("Transaction", ["type: BUY / MINT / BURN", "amount · platformFee", "cantinaFee · stripeId", "(chiave idempotenza)", "buyerId · sellerId"]),
    ]
    db_col_w = (W - 2 * M - 12*mm) / 4
    db_box_h = 40*mm
    for i, (model, fields) in enumerate(models):
        bx = M + i * (db_col_w + 4*mm)
        by = y - db_box_h
        c.setStrokeColor(DARK)
        c.setFillColor(WHITE)
        c.setLineWidth(1)
        c.rect(bx, by, db_col_w, db_box_h, fill=1, stroke=1)
        c.setFillColor(DARK)
        c.rect(bx, by + db_box_h - 7*mm, db_col_w, 7*mm, fill=1, stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(bx + db_col_w/2, by + db_box_h - 4.5*mm, model)
        iy = by + db_box_h - 11.5*mm
        for j, field in enumerate(fields):
            if j == 0:
                c.setFont("Helvetica-Bold", 6.8)
                c.setFillColor(WINE)
            else:
                c.setFont("Helvetica", 6.8)
                c.setFillColor(DARK)
            c.drawString(bx + 4, iy, field)
            iy -= 4.6*mm
    y -= db_box_h + 8*mm

    y = section_title(c, "Punti Aperti (pre-lancio)", y)
    draw_badges(c, [
        "Attivazione blockchain Polygon", "Payout venditori privati (Connect)",
        "P.IVA nel footer", "AdSense publisher ID", "Conferma IVA riscatto con commercialista",
    ], y, ORANGE, "#FDF8F0")

    draw_footer(c, "Wine Bank 24  ·  app.winebank24.eu  ·  Sviluppato con Claude Code (Anthropic)  ·  Luglio 2026  |  Pagina 2 di 2")

c = canvas.Canvas(OUTPUT, pagesize=A4)
c.setTitle("Wine Bank 24 — Mappa Concettuale")
c.setAuthor("Wine Bank 24")
draw_page1(c)
draw_page2(c)
c.save()
print(f"PDF generato: {OUTPUT}")
