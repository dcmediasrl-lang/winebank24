import Link from "next/link";
import { ArrowRight, ShieldCheck, Gem, Wine, Truck, BarChart3, Lock, CheckCircle, ChevronDown } from "lucide-react";
import { HomeNav } from "@/components/shared/home-nav";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { hasLocale } from "../dictionaries";

export const metadata = {
  title: "Come funziona — Wine Bank 24",
  description: "Scopri come collezionare e acquistare NFT di vino pregiato su Wine Bank 24.",
};

const STEPS = [
  {
    num: "01",
    icon: Gem,
    title: "Crea il tuo account collezionista",
    body: "La registrazione è gratuita e richiede solo la tua email. In pochi minuti hai accesso all'intero marketplace di bottiglie certificate da cantine selezionate.",
    image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=85",
    imageAlt: "Cantina casalinga con bottiglie in collezione",
  },
  {
    num: "02",
    icon: Wine,
    title: "Esplora e scegli il tuo vino",
    body: "Naviga tra centinaia di NFT di vini d'eccellenza: Barolo, Brunello, Amarone, Bolgheri e molti altri. Ogni scheda mostra i dettagli del vino, la cantina, le condizioni di conservazione e la storia della bottiglia.",
    image: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=800&q=85",
    imageAlt: "Selezione vini nel marketplace",
  },
  {
    num: "03",
    icon: Lock,
    title: "Acquista il certificato NFT",
    body: "Con un click acquisti il certificato digitale della bottiglia. Il pagamento è sicuro tramite carta di credito. Ricevi la conferma d'acquisto via email con il tuo certificato.",
    image: "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&q=85",
    imageAlt: "Acquisto sicuro NFT",
  },
  {
    num: "04",
    icon: ShieldCheck,
    title: "La bottiglia è custodita e assicurata",
    body: "La tua bottiglia fisica rimane nella cantina certificata, in condizioni di conservazione ottimali (temperatura, umidità, assenza di vibrazioni). Ogni cantina è obbligata a stipulare una polizza assicurativa All Risks sul valore del bene.",
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=85",
    imageAlt: "Cantina di custodia certificata",
  },
  {
    num: "05",
    icon: BarChart3,
    title: "Gestisci la tua collezione",
    body: "Dalla tua area personale consulti i tuoi certificati, la loro provenienza e la cronologia degli acquisti e delle cessioni. Puoi proporre la cessione di un certificato ad altri collezionisti in qualsiasi momento.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=85",
    imageAlt: "Area personale del collezionista",
  },
  {
    num: "06",
    icon: Wine,
    title: "Rivendi o custodisci il tuo NFT",
    body: "Hai due opzioni: rivendere l'NFT nel marketplace a chi vuole acquistarlo, oppure custodirlo nella tua collezione per tutto il tempo che vuoi. E quando la cantina abilita il ritiro fisico, potrai anche riscattare la bottiglia reale.",
    image: "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=800&q=85",
    imageAlt: "Consegna bottiglia fisica",
  },
];

const BENEFITS = [
  { icon: ShieldCheck, title: "Autenticità garantita", desc: "Ogni certificato è collegato a una bottiglia reale, identificata da un numero univoco e custodita in una cantina verificata." },
  { icon: Lock, title: "Proprietà documentata", desc: "Ogni passaggio di proprietà del certificato è registrato dalla piattaforma e consultabile in qualsiasi momento." },
  { icon: BarChart3, title: "Prestigio nel tempo", desc: "I grandi vini acquisiscono prestigio e rarità nel tempo. Collezionare NFT di vino unisce passione e cultura." },
  { icon: Truck, title: "Ritiro fisico del bene", desc: "Quando la cantina abilita il ritiro, puoi riscattare la tua bottiglia pagando IVA, spedizione e una fee di piattaforma del 5%." },
  { icon: Gem, title: "Mercato secondario attivo", desc: "Rivendi i tuoi NFT direttamente nel marketplace a collezionisti da tutto il mondo, senza intermediari." },
  { icon: Wine, title: "Cantine selezionate", desc: "Solo cantine con standard di conservazione certificati e polizza assicurativa possono iscriversi alla piattaforma." },
];

const FAQS = [
  {
    q: "Ho bisogno di sapere cosa sono gli NFT per usare la piattaforma?",
    a: "No. Wine Bank 24 gestisce tutta la complessità tecnica. Per te è come acquistare un prodotto online: scegli, paghi, e il certificato digitale appare nella tua collezione.",
  },
  {
    q: "Come sono garantite le condizioni di conservazione?",
    a: "Ogni cantina iscritta deve rispettare gli standard Wine Bank 24 (temperatura 10–16°C, umidità 60–80%, assenza di vibrazioni) ed è soggetta ad audit annuali. La polizza assicurativa obbligatoria copre il valore delle bottiglie.",
  },
  {
    q: "Posso acquistare solo una parte di una bottiglia?",
    a: "Sì. Per alcune bottiglie di altissimo valore le cantine emettono NFT frazionabili: puoi acquistare una quota (es. 10%) e diventare co-proprietario insieme ad altri collezionisti.",
  },
  {
    q: "Cosa succede se la cantina chiude o va in bancarotta?",
    a: "Il contratto Creator obbliga la cantina a mantenere il bene indisponibile per tutta la durata della certificazione. In caso di inadempimento grave si applicano penali del 200% e la polizza assicurativa tutela i titolari degli NFT.",
  },
  {
    q: "Come funziona la consegna fisica?",
    a: "Richiedi il ritiro dalla tua collezione. La cantina conferma la disponibilità entro 5 giorni lavorativi e la bottiglia arriva a destinazione entro 15 giorni. Le spese di spedizione sono a tuo carico. All'avvenuta consegna l'NFT viene invalidato.",
  },
  {
    q: "Posso comprare come regalo?",
    a: "Assolutamente sì. Puoi trasferire il tuo NFT a un altro utente Wine Bank 24 in qualsiasi momento, rendendolo il regalo perfetto per un appassionato.",
  },
];

export default async function ComeFunzionaPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  // §15 — la voce Blog compare solo se c'è almeno un articolo
  const hasBlogPosts = (await db.blogPost.count({ where: { isPublished: true } }).catch(() => 0)) > 0;
  const dashboardUrl = session
    ? session.user.role === "ADMIN"
      ? `/${lang}/admin`
      : session.user.role === "CANTINA"
      ? `/${lang}/cantina`
      : `/${lang}/collector`
    : null;

  return (
    <div style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)", background: "var(--wine-bg)", color: "var(--wine-text)", minHeight: "100vh" }}>

      <HomeNav lang={lang} nav={{ marketplace: "Marketplace", blog: "Blog", login: "Accedi", register: "Registrati" }} hasBlogPosts={hasBlogPosts} dashboardUrl={dashboardUrl} userName={session?.user?.name || session?.user?.email || null} />

      {/* ── HERO ── */}
      <section className="relative min-h-[72vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1600&q=90"
            alt="Cantina"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(13,7,5,0.92) 0%, rgba(13,7,5,0.65) 60%, rgba(13,7,5,0.3) 100%)" }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border"
            style={{ background: "rgba(223,7,27,0.15)", borderColor: "rgba(223,7,27,0.4)", color: "#f87171" }}>
            <Wine className="w-3.5 h-3.5" />
            Guida per i collezionisti
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
            Come funziona<br />
            <span style={{ background: "var(--wine-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Wine Bank 24
            </span>
          </h1>
          <p className="text-xl text-white/75 max-w-xl mb-10 leading-relaxed">
            Acquista certificati digitali di bottiglie di vino pregiato. La bottiglia rimane custodita in cantina, tu possiedi il certificato — e puoi riscattarla quando la cantina ne abilita il ritiro.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={`/${lang}/register`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white text-base"
              style={{ background: "var(--wine-gradient)" }}>
              Inizia gratis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href={`/${lang}/marketplace`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold border text-white text-base hover:bg-white/10 transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.3)" }}>
              Esplora il marketplace
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 flex flex-col items-center gap-1 animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ── QUICK STATS ── */}
      <section style={{ background: "var(--wine-card)", borderBottom: "1px solid var(--wine-border)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-3 gap-6 sm:gap-8">
          {[
            { value: "100%", label: "Bottiglie fisiche reali" },
            { value: "Univoco", label: "Codice per ogni bottiglia" },
            { value: "All Risks", label: "Polizza assicurativa" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold mb-1"
                style={{ background: "var(--wine-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {value}
              </div>
              <div className="text-sm" style={{ color: "var(--wine-muted)" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STEPS ── */}
      <section className="py-14 sm:py-24 px-4 sm:px-6" style={{ background: "var(--wine-bg)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">6 passi per iniziare</h2>
            <p className="text-lg" style={{ color: "var(--wine-muted)" }}>Dal primo accesso alla tua prima bottiglia in portafoglio</p>
          </div>

          <div className="space-y-20">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const reverse = idx % 2 !== 0;
              return (
                <div key={step.num} className={`grid grid-cols-1 sm:grid-cols-2 gap-10 items-center ${reverse ? "sm:[direction:rtl]" : ""}`}>
                  {/* Image */}
                  <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ direction: "ltr", border: "1px solid var(--wine-border)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={step.image}
                      alt={step.imageAlt}
                      className="w-full h-64 sm:h-80 object-cover"
                    />
                  </div>

                  {/* Text */}
                  <div style={{ direction: "ltr" }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--wine-gradient)" }}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: "var(--wine-red, #df071b)" }}>
                        Passo {step.num}
                      </span>
                    </div>
                    <h3 className="text-2xl font-extrabold mb-4">{step.title}</h3>
                    <p className="text-base leading-relaxed" style={{ color: "var(--wine-muted)" }}>{step.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── VISUAL DIVIDER: winery image ── */}
      <section className="relative h-72 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1600&q=85"
          alt="Cantina"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(13,7,5,0.65)" }}>
          <blockquote className="text-center px-8">
            <p className="text-2xl sm:text-3xl font-bold text-white italic mb-4">
              &ldquo;Il vino di qualità è tra i beni da collezione più ricercati degli ultimi vent&apos;anni.&rdquo;
            </p>
            <cite className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
              Liv-ex Fine Wine Index, 2024
            </cite>
          </blockquote>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-14 sm:py-24 px-4 sm:px-6" style={{ background: "var(--wine-card)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Perché Wine Bank 24</h2>
            <p className="text-lg" style={{ color: "var(--wine-muted)" }}>I vantaggi che rendono unica la nostra piattaforma</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-7 rounded-2xl"
                style={{ background: "var(--wine-bg)", border: "1px solid var(--wine-border)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "var(--wine-gradient)" }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--wine-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WINERY SHOWCASE ── */}
      <section className="py-14 sm:py-24 px-4 sm:px-6" style={{ background: "var(--wine-bg)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Le cantine del futuro</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--wine-muted)" }}>
              Solo cantine con standard di conservazione certificati e polizza assicurativa obbligatoria possono iscriversi. Il tuo vino è al sicuro.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=700&q=85", region: "Piemonte", label: "Barolo & Barbaresco" },
              { img: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=700&q=85", region: "Toscana", label: "Brunello & Super Tuscan" },
              { img: "https://images.unsplash.com/photo-1562601579-599dec564e06?w=700&q=85", region: "Veneto", label: "Amarone & Ripasso" },
            ].map(({ img, region, label }) => (
              <div key={region} className="group relative rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--wine-border)", aspectRatio: "4/3" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={region} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5">
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>{region}</div>
                  <div className="text-white font-bold text-lg">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 sm:py-24 px-4 sm:px-6" style={{ background: "var(--wine-card)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Domande frequenti</h2>
            <p style={{ color: "var(--wine-muted)" }}>Tutto quello che devi sapere prima di iniziare</p>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group rounded-xl overflow-hidden"
                style={{ background: "var(--wine-bg)", border: "1px solid var(--wine-border)" }}>
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-base select-none">
                  <span>{q}</span>
                  <ChevronDown className="w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-180" style={{ color: "var(--wine-muted)" }} />
                </summary>
                <div className="px-6 pb-6 text-sm leading-relaxed" style={{ color: "var(--wine-muted)" }}>
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="relative py-14 sm:py-24 px-4 sm:px-6 text-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=1600&q=85"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "rgba(13,7,5,0.82)" }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            {[CheckCircle, CheckCircle, CheckCircle].map((Icon, i) => (
              <Icon key={i} className="w-5 h-5" style={{ color: "#f59e0b" }} />
            ))}
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-6 text-white leading-tight">
            Inizia a collezionare<br />
            <span style={{ background: "var(--wine-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              vino pregiato oggi
            </span>
          </h2>
          <p className="text-white/70 text-lg mb-10 leading-relaxed">
            Registrazione gratuita. Nessun abbonamento. Acquisti solo quando trovi un vino che ti appassiona.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={`/${lang}/register`}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-white text-lg"
              style={{ background: "var(--wine-gradient)" }}>
              Registrati gratis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href={`/${lang}/marketplace`}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-white text-lg border hover:bg-white/10 transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.3)" }}>
              Esplora il marketplace
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
