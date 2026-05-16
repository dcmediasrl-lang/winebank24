import { BlogPostForm } from "@/components/admin/blog-post-form";
import { getDictionary, hasLocale } from "../../../dictionaries";
import { notFound } from "next/navigation";

export default async function NewBlogPostPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Nuovo articolo</h1>
        <p className="text-stone-500 text-sm mt-1">Crea un nuovo articolo del blog in italiano e inglese</p>
      </div>
      <BlogPostForm lang={lang} />
    </div>
  );
}
