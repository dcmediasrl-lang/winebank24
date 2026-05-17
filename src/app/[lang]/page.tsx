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
    <div style={{ fontFamily: "var(--font-source-sans), 'Source Sans Pro', sans-serif" }}>
      {/* Nav - fixed dark bar */}
      <HomeNav lang={lang} nav={dict.nav} />

      {/* Hero - full width banner image */}
      <section
        className="relative flex items-center justify-center text-center text-white"
        style={{
          minHeight: "600px",
          backgroundImage: "url('/banner.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {/* dark overlay */}
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 px-4 max-w-3xl mx-auto">
          <Image src="/logo.png" alt="Wine Bank 24" width={160} height={80} className="h-16 w-auto mx-auto mb-6 bg-white rounded-xl px-3 py-1.5 object-contain" />
          <p className="text-lg tracking-widest uppercase mb-4 text-white/80">{dict.home.hero_subtitle}</p>
          <div className="flex gap-4 justify-center flex-wrap mt-8">
            <Link href={`/${lang}/marketplace`} className="px-8 py-3 font-bold uppercase tracking-wider text-white rounded transition-colors" style={{ background: "var(--ev-coral)" }}>
              {dict.home.cta_marketplace}
            </Link>
            <Link href={`/${lang}/register`} className="px-8 py-3 font-bold uppercase tracking-wider text-white rounded border-2 border-white/50 hover:border-white transition-colors">
              {dict.home.cta_register}
            </Link>
          </div>
        </div>
      </section>

      {/* Intro section - coral background */}
      <section className="text-white text-center py-20 px-4" style={{ background: "var(--ev-coral)" }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xl font-light mb-3 text-white/80">{lang === "it" ? "La piattaforma NFT per il vino italiano" : "The NFT platform for Italian wine"}</p>
          <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight">{dict.home.hero_title}</h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">{lang === "it" ? "Tokenizza, colleziona e commercia bottiglie di vino pregiate come certificati digitali su blockchain." : "Tokenize, collect and trade premium wine bottles as digital certificates on blockchain."}</p>
          <Link href={`/${lang}/marketplace`} className="inline-block px-10 py-3 text-white font-bold uppercase tracking-wider rounded transition-colors" style={{ background: "var(--ev-dark)" }}>
            {dict.home.cta_marketplace}
          </Link>
        </div>
      </section>

      {/* AdSense */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <AdSenseBanner slot="homepage-hero" format="horizontal" className="w-full" />
      </div>

      {/* Features section - white */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm uppercase tracking-widest font-bold mb-2 block" style={{ color: "var(--ev-coral)" }}>
              {dict.home.how_title}
            </span>
            <h2 className="text-3xl font-bold" style={{ color: "var(--ev-heading)" }}>
              {lang === "it" ? "Come funziona la piattaforma" : "How the platform works"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--ev-coral)" }}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--ev-heading)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ev-body)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - gray section */}
      <section className="py-20 px-4" style={{ background: "var(--ev-gray)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-sm uppercase tracking-widest font-bold mb-2 block" style={{ color: "var(--ev-coral)" }}>
              {lang === "it" ? "Il processo" : "The process"}
            </span>
            <h2 className="text-3xl font-bold" style={{ color: "var(--ev-heading)" }}>{dict.home.how_title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { num: "01", title: dict.home.how_1_title, desc: dict.home.how_1_desc },
              { num: "02", title: dict.home.how_2_title, desc: dict.home.how_2_desc },
              { num: "03", title: dict.home.how_3_title, desc: dict.home.how_3_desc },
            ].map(({ num, title, desc }) => (
              <div key={num} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="text-4xl font-black mb-3" style={{ color: "var(--ev-coral)", opacity: 0.3 }}>{num}</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--ev-heading)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ev-body)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog preview - white with card grid */}
      {recentPosts.length > 0 && (
        <section className="bg-white py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-sm uppercase tracking-widest font-bold mb-2 block" style={{ color: "var(--ev-coral)" }}>
                  {lang === "it" ? "Dal blog" : "From the blog"}
                </span>
                <h2 className="text-3xl font-bold" style={{ color: "var(--ev-heading)" }}>{dict.home.blog_title}</h2>
              </div>
              <Link href={`/${lang}/blog`} className="text-sm font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--ev-coral)" }}>
                {dict.blog.read_more} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {recentPosts.map(post => (
                <Link key={post.slug} href={`/${lang}/blog/${post.slug}`} className="block group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
                  <div className="h-40 overflow-hidden bg-gray-100">
                    <img src="/pic01.jpg" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-5">
                    {post.category && <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--ev-coral)" }}>{post.category}</span>}
                    <h3 className="font-bold mt-1 mb-2 line-clamp-2" style={{ color: "var(--ev-heading)" }}>
                      {lang === "en" ? post.titleEn : post.titleIt}
                    </h3>
                    <p className="text-sm line-clamp-2" style={{ color: "var(--ev-body)" }}>
                      {lang === "en" ? post.excerptEn : post.excerptIt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
