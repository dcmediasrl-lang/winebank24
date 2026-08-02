import { db } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit, Eye, EyeOff, Calendar } from "lucide-react";
import { hasLocale } from "../../dictionaries";
import { notFound } from "next/navigation";

export default async function AdminBlogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const posts = await db.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog</h1>
          <p className="text-[var(--wine-muted)] text-sm mt-1">{posts.length} articoli totali</p>
        </div>
        <Link href={`/${lang}/admin/blog/new`}>
          <Button className="bg-[#993300] hover:bg-[#df071b] text-white font-semibold">
            <Plus className="w-4 h-4 mr-2" /> Nuovo articolo
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {posts.length === 0 && (
          <p className="text-[var(--wine-muted)] text-sm">Nessun articolo. Crea il primo!</p>
        )}
        {posts.map(post => (
          <Card key={post.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {post.isPublished
                      ? <Eye className="w-3.5 h-3.5 text-green-500" />
                      : <EyeOff className="w-3.5 h-3.5 text-[var(--wine-muted)]" />}
                    {post.category && (
                      <span className="text-xs bg-[#993300]/20 text-[#df071b] px-2 py-0.5 rounded-full">{post.category}</span>
                    )}
                  </div>
                  <p className="font-semibold text-white truncate">{post.titleIt}</p>
                  <p className="text-sm text-[var(--wine-muted)] truncate">{post.titleEn}</p>
                  {post.publishedAt && (
                    <div className="flex items-center gap-1 text-xs text-white/70 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.publishedAt).toLocaleDateString("it-IT")}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {post.isPublished && (
                    <Link href={`/${lang}/blog/${post.slug}`} target="_blank">
                      <Button variant="outline" size="sm">Vedi</Button>
                    </Link>
                  )}
                  <Link href={`/${lang}/admin/blog/${post.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
