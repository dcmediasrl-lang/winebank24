import Link from "next/link";
import Image from "next/image";
import { Gem, Shield, ArrowRight, Wine } from "lucide-react";
import { getDictionary, hasLocale } from "./dictionaries";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { HomeNav } from "@/components/shared/home-nav";
import { AdSenseBanner } from "@/components/shared/adsense-banner";
import { HeroSlider } from "@/components/shared/hero-slider";
import { auth } from "@/lib/auth";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const session = await auth();

  const dashboardUrl = session
    ? session.user.role === "ADMIN"
      ? `/${lang}/admin`
      : session.user.role === "CANTINA"
      ? `/${lang}/cantina`
      : `/${lang}/collector`
    : null;

  const recentPosts = await db.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { slug: true, titleIt: true, titleEn: true, excerptIt: true, excerptEn: true, category: true, publishedAt: true },
  }).catch(() => []);

  const features = lang === "en"
    ? [
        { icon: Wine, title: "Wineries", desc: "Create digital certificates for your bottles. Manage collections and sales directly on the platform." },
        { icon: Gem, title: "Collectors", desc: "Buy certified digital certificates of rare bottles. Collect, resell or request physical delivery when the winery makes it available." },
        { icon: Shield, title: "Secure & Transparent", desc: "Every certificate is linked to an identified physical bottle. Documented ownership and transfers tracked by the platform." },
      ]
    : [
        { icon: Wine, title: "Cantine", desc: "Crea certificati digitali per le tue bottiglie. Gestisci collezioni e vendite direttamente in piattaforma." },
        { icon: Gem, title: "Collezionisti", desc: "Acquista certificati digitali di bottiglie rare. Colleziona, rivendi o richiedi la consegna fisica della bottiglia." },
        { icon: Shield, title: "Sicuro & Trasparente", desc: "Ogni certificato è collegato a una bottiglia fisica identificata. Proprietà documentata e passaggi tracciati dalla piattaforma." },
      ];

  return (
    <div style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)", background: "var(--wine-bg)", color: "var(--wine-text)", minHeight: "100vh" }}>

      {/* NAV */}
      <HomeNav lang={lang} nav={dict.nav} dashboardUrl={dashboardUrl} userName={session?.user?.name || session?.user?.email || null} />

      {/* Spacer for fixed navbar (logo 160px + py-2 = ~176px) */}
      <div style={{ height: "112px" }} />

      {/* HERO SLIDER */}
      <HeroSlider
        lang={lang}
        slides={lang === "it" ? [
          {
            image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1600&q=85",
            tag: "Certificati digitali per il vino da collezione",
            title: "Il grande vino da collezione",
            titleAccent: "da custodire in formato digitale",
            subtitle: "Colleziona bottiglie di vino pregiato: ogni certificato digitale documenta proprietà e provenienza di una bottiglia reale.",
            cta: { label: "Esplora il Marketplace", href: `/${lang}/marketplace` },
            ctaSecondary: { label: "Come funziona", href: `/${lang}/come-funziona` },
          },
          {
            image: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1600&q=85",
            tag: "Per i Collezionisti",
            title: "Colleziona",
            titleAccent: "bottiglie rare",
            titleAfter: "ovunque nel mondo",
            subtitle: "Acquista certificati digitali di vini esclusivi. Rivendi, regala o richiedi la consegna fisica quando la cantina la rende disponibile.",
            cta: { label: "Registrati come Collezionista", href: `/${lang}/register` },
            ctaSecondary: { label: "Sfoglia i vini", href: `/${lang}/marketplace` },
          },
          {
            image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1600&q=85",
            tag: "Per le Cantine",
            title: "Porta la tua cantina",
            titleAccent: "nel futuro",
            subtitle: "Crea certificati digitali per le tue migliori bottiglie. Dai visibilità alla tua produzione e raggiungi appassionati e collezionisti in tutto il mondo.",
            cta: { label: "Iscriviti come Cantina", href: `/${lang}/register` },
            ctaSecondary: { label: "Scopri i vantaggi", href: `#features` },
          },
          {
            image: "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=1600&q=85",
            tag: "Autenticità & Sicurezza",
            title: "Ogni bottiglia,",
            titleAccent: "certificata",
            titleAfter: "e tracciata",
            subtitle: "Proprietà documentata e trasferimenti tracciati: ogni passaggio del certificato e la storia della bottiglia restano consultabili.",
            cta: { label: "Inizia ora", href: `/${lang}/register` },
            ctaSecondary: { label: "Leggi di più", href: `/${lang}/blog` },
          },
        ] : [
          {
            image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1600&q=85",
            tag: "Digital certificates for fine wine",
            title: "Fine collectible wine",
            titleAccent: "preserved in digital form",
            subtitle: "Collect premium wine bottles: every digital certificate documents the ownership and provenance of a real bottle.",
            cta: { label: "Explore Marketplace", href: `/${lang}/marketplace` },
            ctaSecondary: { label: "How it works", href: `/${lang}/come-funziona` },
          },
          {
            image: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1600&q=85",
            tag: "For Collectors",
            title: "Collect",
            titleAccent: "rare bottles",
            titleAfter: "from anywhere",
            subtitle: "Buy digital certificates of exclusive wines. Resell, gift or request physical delivery when the winery makes it available.",
            cta: { label: "Register as Collector", href: `/${lang}/register` },
            ctaSecondary: { label: "Browse wines", href: `/${lang}/marketplace` },
          },
          {
            image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1600&q=85",
            tag: "For Wineries",
            title: "Bring your winery",
            titleAccent: "into the future",
            subtitle: "Create digital certificates for your finest bottles. Reach collectors worldwide and create new revenue streams for your production.",
            cta: { label: "Join as Winery", href: `/${lang}/register` },
            ctaSecondary: { label: "Discover benefits", href: `#features` },
          },
          {
            image: "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=1600&q=85",
            tag: "Authenticity & Security",
            title: "Every bottle,",
            titleAccent: "certified",
            titleAfter: "and traced",
            subtitle: "Documented ownership and tracked transfers: every change of hands and the full history of the bottle remain on record.",
            cta: { label: "Get started", href: `/${lang}/register` },
            ctaSecondary: { label: "Read more", href: `/${lang}/blog` },
          },
        ]}
      />

      {/* HOW IT WORKS */}
      <section className="py-12 sm:py-20 px-4 sm:px-6" style={{ background: "var(--wine-card)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold mb-3">{dict.home.how_title}</h2>
            <p style={{ color: "var(--wine-muted)" }}>{lang === "it" ? "Tre semplici passaggi per iniziare" : "Three simple steps to get started"}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { num: "01", title: dict.home.how_1_title, desc: dict.home.how_1_desc, icon: "🍷" },
              { num: "02", title: dict.home.how_2_title, desc: dict.home.how_2_desc, icon: "🔍" },
              { num: "03", title: dict.home.how_3_title, desc: dict.home.how_3_desc, icon: "✅" },
            ].map(({ num, title, desc, icon }) => (
              <div key={num} className="p-8 rounded-2xl relative" style={{ background: "var(--wine-bg)", border: "1px solid var(--wine-border)" }}>
                <div className="text-4xl mb-4">{icon}</div>
                <div className="text-sm font-bold mb-2 uppercase tracking-widest" style={{ background: "var(--wine-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{num}</div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--wine-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADSENSE */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <AdSenseBanner slot="homepage-hero" format="horizontal" className="w-full" />
      </div>

      {/* FEATURES */}
      <section className="py-12 sm:py-20 px-4 sm:px-6" style={{ background: "var(--wine-bg)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold mb-3">{lang === "it" ? "Per chi è Wine Bank 24" : "Who is Wine Bank 24 for"}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-8 rounded-2xl group hover:border-opacity-40 transition-all" style={{ background: "var(--wine-card)", border: "1px solid var(--wine-border)" }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: "var(--wine-gradient)" }}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--wine-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WINE REGIONS / COLLECTIONS */}
      <section className="py-12 sm:py-20 px-4 sm:px-6" style={{ background: "var(--wine-card)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold">{lang === "it" ? "Regioni del Vino" : "Wine Regions"}</h2>
              <p className="mt-2" style={{ color: "var(--wine-muted)" }}>{lang === "it" ? "Esplora le migliori regioni vinicole del mondo" : "Explore the world's finest wine regions"}</p>
            </div>
            <Link href={`/${lang}/marketplace`} className="text-sm font-bold flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ color: "#df071b" }}>
              {lang === "it" ? "Vedi tutto" : "See all"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {[
              // Nessun conteggio: i numeri pubblici devono corrispondere a dati reali.
              // Le regioni sono descritte dalle loro denominazioni tipiche.
              { name: "Toscana", img: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400&q=80", count: "Brunello · Bolgheri · Chianti" },
              { name: "Piemonte", img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80", count: "Barolo · Barbaresco" },
              { name: "Sicilia", img: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&q=80", count: "Etna · Nero d\u2019Avola" },
              { name: "Veneto", img: "https://images.unsplash.com/photo-1562601579-599dec564e06?w=400&q=80", count: "Amarone · Valpolicella" },
              { name: "Campania", img: "https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?w=400&q=80", count: "Taurasi · Fiano" },
              { name: "Lombardia", img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80", count: "Franciacorta · Valtellina" },
            ].map(({ name, img, count }) => (
              <Link key={name} href={`/${lang}/marketplace`} className="group relative rounded-xl overflow-hidden block" style={{ aspectRatio: "1", border: "1px solid var(--wine-border)" }}>
                <Image src={img} alt={name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <div className="font-bold text-white">{name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{count}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG PREVIEW */}
      {recentPosts.length > 0 && (
        <section className="py-12 sm:py-20 px-4 sm:px-6" style={{ background: "var(--wine-bg)" }}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-extrabold">{dict.home.blog_title}</h2>
                <p className="mt-2" style={{ color: "var(--wine-muted)" }}>{lang === "it" ? "Notizie e approfondimenti dal mondo del vino" : "News and insights from the wine world"}</p>
              </div>
              <Link href={`/${lang}/blog`} className="text-sm font-bold flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ color: "#df071b" }}>
                {dict.blog.read_more} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {recentPosts.map((post, i) => (
                <Link key={post.slug} href={`/${lang}/blog/${post.slug}`} className="group rounded-2xl overflow-hidden block transition-transform hover:-translate-y-1" style={{ background: "var(--wine-card)", border: "1px solid var(--wine-border)" }}>
                  <div className="relative h-48 overflow-hidden">
                    <Image src={`/pic0${(i % 3) + 1}.jpg`} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    {post.category && <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#df071b" }}>{post.category}</span>}
                    <h3 className="font-bold mt-2 mb-2 line-clamp-2">{lang === "en" ? post.titleEn : post.titleIt}</h3>
                    <p className="text-sm line-clamp-2" style={{ color: "var(--wine-muted)" }}>{lang === "en" ? post.excerptEn : post.excerptIt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA BANNER */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 text-center relative overflow-hidden" style={{ background: "var(--wine-gradient)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 50%, white 0%, transparent 50%)" }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white">
            {lang === "it" ? "Inizia a collezionare oggi" : "Start collecting today"}
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            {lang === "it" ? "Scopri bottiglie selezionate, documentate e custodite in condizioni controllate." : "Discover selected bottles, documented and kept in controlled conditions."}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href={`/${lang}/register`} className="px-8 py-3 rounded-lg font-bold bg-white transition-opacity hover:opacity-90" style={{ color: "var(--wine-red)" }}>
              {dict.home.cta_register}
            </Link>
            <Link href={`/${lang}/marketplace`} className="px-8 py-3 rounded-lg font-bold text-white border-2 border-white/40 hover:border-white transition-colors">
              {dict.home.cta_marketplace}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
