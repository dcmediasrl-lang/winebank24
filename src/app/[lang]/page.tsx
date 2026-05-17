import Link from "next/link";
import Image from "next/image";
import { Gem, Shield, ArrowRight, Wine } from "lucide-react";
import { getDictionary, hasLocale } from "./dictionaries";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { HomeNav } from "@/components/shared/home-nav";
import { AdSenseBanner } from "@/components/shared/adsense-banner";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const recentPosts = await db.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { slug: true, titleIt: true, titleEn: true, excerptIt: true, excerptEn: true, category: true, publishedAt: true },
  }).catch(() => []);

  const features = lang === "en"
    ? [
        { icon: Wine, title: "Wineries", desc: "Mint NFTs based on your bottle production. Manage collections and sales directly on the platform." },
        { icon: Gem, title: "Collectors", desc: "Buy NFTs of rare bottles. Collect, resell or request physical delivery of the bottle." },
        { icon: Shield, title: "Secure & Transparent", desc: "Every NFT is registered on Polygon blockchain. Verifiable ownership, tracked transfers." },
      ]
    : [
        { icon: Wine, title: "Cantine", desc: "Minta NFT basati sulla tua produzione di bottiglie. Gestisci collezioni e vendite direttamente in piattaforma." },
        { icon: Gem, title: "Collezionisti", desc: "Acquista NFT di bottiglie rare. Colleziona, rivendi o richiedi la consegna fisica della bottiglia." },
        { icon: Shield, title: "Sicuro & Trasparente", desc: "Ogni NFT è registrato su blockchain Polygon. Proprietà verificabile, trasferimenti tracciati." },
      ];

  return (
    <div style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)", background: "var(--wine-bg)", color: "var(--wine-text)", minHeight: "100vh" }}>

      {/* NAV */}
      <HomeNav lang={lang} nav={dict.nav} />

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ minHeight: "100vh", background: "var(--wine-bg)" }}>
        {/* Background gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: "var(--wine-gradient)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: "#df071b" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 text-sm" style={{ borderColor: "var(--wine-border)", color: "var(--wine-muted)" }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--wine-red-2)" }} />
                {lang === "it" ? "Piattaforma NFT per il vino italiano" : "NFT Platform for Italian Wine"}
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
                {lang === "it" ? (
                  <>Tokenizza il <span style={{ background: "var(--wine-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Grande Vino</span> Italiano</>
                ) : (
                  <>Tokenize <span style={{ background: "var(--wine-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Italian Fine</span> Wine</>
                )}
              </h1>
              <p className="text-lg mb-10 max-w-lg" style={{ color: "var(--wine-muted)" }}>
                {dict.home.hero_subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href={`/${lang}/marketplace`} className="px-8 py-3 rounded-lg font-bold text-white transition-opacity hover:opacity-90" style={{ background: "var(--wine-gradient)" }}>
                  {dict.home.cta_marketplace}
                </Link>
                <Link href={`/${lang}/register`} className="px-8 py-3 rounded-lg font-bold transition-colors" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
                  {dict.home.cta_register}
                </Link>
              </div>
              {/* Stats */}
              <div className="flex flex-wrap gap-8 mt-12">
                {[
                  { value: "12.500+", label: lang === "it" ? "NFT Bottiglie" : "NFT Bottles" },
                  { value: "85+", label: lang === "it" ? "Cantine Partner" : "Partner Wineries" },
                  { value: "3.200+", label: lang === "it" ? "Collezionisti" : "Collectors" },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div className="text-3xl font-extrabold" style={{ background: "var(--wine-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{value}</div>
                    <div className="text-sm mt-1" style={{ color: "var(--wine-muted)" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Right: hero image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 60px rgba(153,51,0,0.3)" }}>
                <img
                  src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80"
                  alt="Wine bottles"
                  className="w-full h-auto object-cover"
                  style={{ borderRadius: "16px", maxHeight: "500px", objectFit: "cover" }}
                />
                {/* Floating card */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl backdrop-blur-md" style={{ background: "rgba(26,15,15,0.85)", border: "1px solid var(--wine-border)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs mb-1" style={{ color: "var(--wine-muted)" }}>{lang === "it" ? "NFT in evidenza" : "Featured NFT"}</div>
                      <div className="font-bold">Barolo Riserva 2018</div>
                      <div className="text-sm" style={{ color: "var(--wine-muted)" }}>Cantina Marchesi di Barolo</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs mb-1" style={{ color: "var(--wine-muted)" }}>{lang === "it" ? "Prezzo" : "Price"}</div>
                      <div className="font-extrabold text-xl" style={{ background: "var(--wine-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>€ 450</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6" style={{ background: "var(--wine-card)" }}>
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
      <div className="max-w-5xl mx-auto px-6 py-8">
        <AdSenseBanner slot="homepage-hero" format="horizontal" className="w-full" />
      </div>

      {/* FEATURES */}
      <section className="py-20 px-6" style={{ background: "var(--wine-bg)" }}>
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
      <section className="py-20 px-6" style={{ background: "var(--wine-card)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold">{lang === "it" ? "Regioni del Vino" : "Wine Regions"}</h2>
              <p className="mt-2" style={{ color: "var(--wine-muted)" }}>{lang === "it" ? "Esplora le migliori regioni vinicole d'Italia" : "Explore Italy's finest wine regions"}</p>
            </div>
            <Link href={`/${lang}/marketplace`} className="text-sm font-bold flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ color: "#df071b" }}>
              {lang === "it" ? "Vedi tutto" : "See all"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {[
              { name: "Toscana", img: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400&q=80", count: lang === "it" ? "142 NFT" : "142 NFTs" },
              { name: "Piemonte", img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80", count: lang === "it" ? "98 NFT" : "98 NFTs" },
              { name: "Sicilia", img: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&q=80", count: lang === "it" ? "76 NFT" : "76 NFTs" },
              { name: "Veneto", img: "https://images.unsplash.com/photo-1562601579-599dec564e06?w=400&q=80", count: lang === "it" ? "63 NFT" : "63 NFTs" },
              { name: "Campania", img: "https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?w=400&q=80", count: lang === "it" ? "45 NFT" : "45 NFTs" },
              { name: "Lombardia", img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80", count: lang === "it" ? "38 NFT" : "38 NFTs" },
            ].map(({ name, img, count }) => (
              <Link key={name} href={`/${lang}/marketplace`} className="group relative rounded-xl overflow-hidden block" style={{ aspectRatio: "1", border: "1px solid var(--wine-border)" }}>
                <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
        <section className="py-20 px-6" style={{ background: "var(--wine-bg)" }}>
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
                  <div className="h-48 overflow-hidden">
                    <img src={`/pic0${(i % 3) + 1}.jpg`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
      <section className="py-20 px-6 text-center relative overflow-hidden" style={{ background: "var(--wine-gradient)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 50%, white 0%, transparent 50%)" }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white">
            {lang === "it" ? "Inizia a collezionare oggi" : "Start collecting today"}
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            {lang === "it" ? "Unisciti a migliaia di appassionati e cantine sul primo marketplace NFT per il vino italiano." : "Join thousands of enthusiasts and wineries on the first NFT marketplace for Italian wine."}
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
