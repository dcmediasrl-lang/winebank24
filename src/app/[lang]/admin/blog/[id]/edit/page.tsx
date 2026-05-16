import { BlogPostForm } from "@/components/admin/blog-post-form";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { hasLocale } from "../../../../dictionaries";

export default async function EditBlogPostPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();

  const post = await db.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Modifica articolo</h1>
        <p className="text-stone-500 text-sm mt-1">Aggiorna il contenuto in italiano e inglese</p>
      </div>
      <BlogPostForm lang={lang} post={post} />
    </div>
  );
}
