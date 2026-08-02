import Image from "next/image";
import { getDictionary, hasLocale } from "../../dictionaries";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Wine, Calendar, ArrowLeft } from "lucide-react";

export default async function BlogPostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();

  const [dict, post] = await Promise.all([
    getDictionary(lang),
    db.blogPost.findUnique({ where: { slug, isPublished: true } }),
  ]);

  if (!post) notFound();

  const title = lang === "en" ? post.titleEn : post.titleIt;
  const content = lang === "en" ? post.contentEn : post.contentIt;

  return (
    <div className="min-h-screen bg-[var(--wine-bg)]">
      <header className="bg-[var(--wine-card)] text-white px-8 py-5 flex items-center justify-between">
        <Link href={`/${lang}`} className="flex items-center gap-2">
          <Wine className="w-6 h-6 text-amber-400" />
          <span className="font-bold text-lg">Wine Bank 24</span>
        </Link>
        <Link href={lang === "en" ? `/it/blog/${slug}` : `/en/blog/${slug}`} className="text-[var(--wine-muted)] text-sm hover:text-[#df071b]">
          {lang === "en" ? "🇮🇹 IT" : "🇬🇧 EN"}
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href={`/${lang}/blog`} className="flex items-center gap-2 text-[var(--wine-muted)] hover:text-[#df071b] text-sm mb-8">
          <ArrowLeft className="w-4 h-4" />
          {dict.blog.back}
        </Link>

        {post.coverImage && (
          <div className="relative rounded-xl overflow-hidden mb-8 h-64 sm:h-80">
            <Image src={post.coverImage} alt={title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
          </div>
        )}

        <div className="mb-6">
          {post.category && (
            <span className="text-xs text-amber-600 font-semibold uppercase tracking-wide">{post.category}</span>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-3">{title}</h1>
          {post.publishedAt && (
            <div className="flex items-center gap-1 text-sm text-white/40">
              <Calendar className="w-4 h-4" />
              {dict.blog.published} {new Date(post.publishedAt).toLocaleDateString(lang === "en" ? "en-GB" : "it-IT")}
            </div>
          )}
        </div>

        <div
          className="prose prose-invert max-w-none text-white/80 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br/>") }}
        />
      </div>
    </div>
  );
}
