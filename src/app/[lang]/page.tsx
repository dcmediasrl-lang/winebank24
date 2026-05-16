import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Wine, Gem, Shield, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDictionary, hasLocale } from "./dictionaries";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

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
    <div className="min-h-screen bg-stone-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Wine className="w-6 h-6 text-amber-400" />
          <span className="font-bold text-lg">Wine Bank 24</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${lang}/marketplace`} className={cn(buttonVariants({ variant: "ghost" }), "text-stone-300 hover:text-white")}>
            {dict.nav.marketplace}
          </Link>
          <Link href={`/${lang}/blog`} className={cn(buttonVariants({ variant: "ghost" }), "text-stone-300 hover:text-white")}>
            {dict.nav.blog}
          </Link>
          <Link href={`/${lang}/login`} className={cn(buttonVariants({ variant: "outline" }), "border-stone-600 text-stone-200 hover:bg-stone-800")}>
            {dict.nav.login}
          </Link>
          <Link href={`/${lang}/register`} className={cn(buttonVariants(), "bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold")}>
            {dict.nav.register}
          </Link>
          {/* Language switcher */}
          <Link href={lang === "en" ? "/it" : "/en"} className="text-stone-500 text-xs hover:text-amber-400 transition-colors ml-2">
            {lang === "en" ? "🇮🇹 IT" : "🇬🇧 EN"}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center px-4 py-28">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-amber-400 text-sm mb-6">
          <Gem className="w-3.5 h-3.5" /> NFT · Blockchain Polygon
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
          {dict.home.hero_title.split("Italy's finest").length > 1
            ? <>{dict.home.hero_title.split("Italy's finest")[0]}<span className="text-amber-400">Italy&apos;s finest</span>{dict.home.hero_title.split("Italy's finest")[1]}</>
            : <>{dict.home.hero_title.split("pregiati").join("")}<span className="text-amber-400">{lang === "it" ? "pregiati" : ""}</span></>
          }
        </h1>
        <p className="text-stone-400 text-xl max-w-2xl mx-auto mb-10">
          {dict.home.hero_subtitle}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href={`/${lang}/marketplace`} className={cn(buttonVariants({ size: "lg" }), "bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-8")}>
            {dict.home.cta_marketplace}
          </Link>
          <Link href={`/${lang}/register`} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-stone-600 text-stone-200 hover:bg-stone-800 px-8")}>
            {dict.home.cta_register}
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10 text-white">{dict.home.how_title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { num: "01", title: dict.home.how_1_title, desc: dict.home.how_1_desc },
            { num: "02", title: dict.home.how_2_title, desc: dict.home.how_2_desc },
            { num: "03", title: dict.home.how_3_title, desc: dict.home.how_3_desc },
          ].map(({ num, title, desc }) => (
            <div key={num} className="bg-stone-900 border border-stone-800 rounded-xl p-6">
              <div className="text-3xl font-bold text-amber-400/30 mb-3">{num}</div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-24 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-stone-900 border border-stone-800 rounded-xl p-6">
            <Icon className="w-8 h-8 text-amber-400 mb-4" />
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-stone-400 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* Blog preview */}
      {recentPosts.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">{dict.home.blog_title}</h2>
            <Link href={`/${lang}/blog`} className="text-amber-400 text-sm hover:underline flex items-center gap-1">
              {dict.blog.read_more} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {recentPosts.map(post => (
              <Link key={post.slug} href={`/${lang}/blog/${post.slug}`} className="block bg-stone-900 border border-stone-800 rounded-xl p-5 hover:border-amber-500/40 transition-colors">
                {post.category && <span className="text-xs text-amber-400 font-medium uppercase tracking-wide">{post.category}</span>}
                <h3 className="font-semibold text-white mt-1 mb-2 line-clamp-2">
                  {lang === "en" ? post.titleEn : post.titleIt}
                </h3>
                <p className="text-stone-400 text-sm line-clamp-3">
                  {lang === "en" ? post.excerptEn : post.excerptIt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-stone-800 text-center py-6 text-stone-500 text-sm">
        © {new Date().getFullYear()} Wine Bank 24 — {dict.footer.rights}
      </footer>
    </div>
  );
}
