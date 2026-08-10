import Image from "next/image";
import { getDictionary, hasLocale } from "../dictionaries";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Wine, Calendar } from "lucide-react";
import type { Metadata } from "next";
import { metadatiPagina, testo } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = testo("blog", lang);
  return metadatiPagina({ lang, path: "/blog", titolo: t.titolo, descrizione: t.descrizione });
}

export default async function BlogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  const posts = await db.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
  }).catch(() => []);

  return (
    <div className="min-h-screen bg-[var(--wine-bg)]">
      {/* Header */}
      <header className="bg-[var(--wine-card)] text-white px-8 py-5 flex items-center justify-between">
        <Link href={`/${lang}`} className="flex items-center gap-2">
          <Wine className="w-6 h-6 text-amber-400" />
          <span className="font-bold text-lg">Wine Bank 24</span>
        </Link>
        <div className="flex gap-4 text-sm">
          <Link href={`/${lang}/marketplace`} className="text-white/70 hover:text-white">{dict.nav.marketplace}</Link>
          <Link href={`/${lang}/login`} className="text-white/70 hover:text-white">{dict.nav.login}</Link>
          <Link href={lang === "en" ? "/it/blog" : "/en/blog"} className="text-[var(--wine-muted)] hover:text-[#df071b]">
            {lang === "en" ? "🇮🇹 IT" : "🇬🇧 EN"}
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">{dict.blog.title}</h1>
          <p className="text-[var(--wine-muted)] text-lg">{dict.blog.subtitle}</p>
        </div>

        {posts.length === 0 ? (
          <p className="text-white/40">{dict.blog.no_posts}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <Link key={post.slug} href={`/${lang}/blog/${post.slug}`} className="group block bg-[var(--wine-card)] rounded-xl border border-[var(--wine-border)] overflow-hidden hover:shadow-md transition-shadow hover:bg-[var(--wine-card-hover)]">
                {post.coverImage && (
                  <div className="relative h-48 overflow-hidden">
                    <Image src={post.coverImage} alt={lang === "en" ? post.titleEn : post.titleIt} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                )}
                <div className="p-5">
                  {post.category && (
                    <span className="text-xs text-amber-600 font-semibold uppercase tracking-wide">{post.category}</span>
                  )}
                  <h2 className="font-bold text-white mt-1 mb-2 line-clamp-2 group-hover:text-[#df071b] transition-colors">
                    {lang === "en" ? post.titleEn : post.titleIt}
                  </h2>
                  {(lang === "en" ? post.excerptEn : post.excerptIt) && (
                    <p className="text-[var(--wine-muted)] text-sm line-clamp-3 mb-4">
                      {lang === "en" ? post.excerptEn : post.excerptIt}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Calendar className="w-3 h-3" />
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(lang === "en" ? "en-GB" : "it-IT") : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
