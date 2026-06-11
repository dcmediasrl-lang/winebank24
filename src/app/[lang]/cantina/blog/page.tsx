import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Eye, EyeOff, Calendar, Edit } from "lucide-react";

export default async function CantinaBlogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") redirect(`/${lang}/login`);

  const cantina = await db.cantina.findUnique({ where: { userId: session.user.id } });
  if (!cantina) redirect(`/${lang}/cantina`);

  const posts = await db.blogPost.findMany({
    where: { cantinaId: cantina.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Il mio Blog</h1>
          <p className="text-[var(--wine-muted)] text-sm mt-1">
            {posts.length} {posts.length === 1 ? "articolo" : "articoli"} · gli articoli pubblicati appaiono nel blog della piattaforma
          </p>
        </div>
        <Link
          href={`/${lang}/cantina/blog/new`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white text-sm"
          style={{ background: "var(--wine-gradient)" }}
        >
          <Plus className="w-4 h-4" />
          Nuovo articolo
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-white/30 bg-[#1a0f0f] rounded-2xl border border-[var(--wine-border)]">
          <p className="text-5xl mb-4">📝</p>
          <p className="text-lg font-semibold text-white/50 mb-2">Nessun articolo ancora</p>
          <p className="text-sm mb-6">Racconta la storia della tua cantina, presenta nuove annate o condividi aggiornamenti con i tuoi collezionisti.</p>
          <Link
            href={`/${lang}/cantina/blog/new`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-white text-sm"
            style={{ background: "var(--wine-gradient)" }}
          >
            <Plus className="w-4 h-4" />
            Scrivi il primo articolo
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div
              key={post.id}
              className="bg-[#1a0f0f] rounded-xl border border-[var(--wine-border)] px-5 py-4 flex items-start justify-between gap-4 hover:border-amber-600/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {post.isPublished
                    ? <Eye className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    : <EyeOff className="w-3.5 h-3.5 text-white/30 shrink-0" />}
                  {post.category && (
                    <Badge className="text-xs bg-amber-900/30 text-amber-400 border-amber-700/30">
                      {post.category}
                    </Badge>
                  )}
                  {!post.isPublished && (
                    <Badge className="text-xs bg-white/5 text-white/40 border-white/10">Bozza</Badge>
                  )}
                </div>
                <p className="font-semibold text-white truncate">{post.titleIt}</p>
                {post.excerptIt && (
                  <p className="text-sm text-white/40 truncate mt-0.5">{post.excerptIt}</p>
                )}
                <p className="text-xs text-white/25 mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                  {post.isPublished && (
                    <>
                      {" · "}
                      <Link href={`/${lang}/blog/${post.slug}`} className="text-amber-500 hover:underline" target="_blank">
                        Vedi nel blog →
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <Link
                href={`/${lang}/cantina/blog/${post.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:border-amber-600/40 hover:text-amber-400 transition-colors shrink-0"
              >
                <Edit className="w-3.5 h-3.5" />
                Modifica
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
