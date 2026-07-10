"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

type BlogPost = {
  id: string;
  slug: string;
  titleIt: string;
  titleEn: string;
  excerptIt: string | null;
  excerptEn: string | null;
  contentIt: string;
  contentEn: string;
  coverImage: string | null;
  category: string | null;
  isPublished: boolean;
};

export function BlogPostForm({ lang, post }: { lang: string; post?: BlogPost }) {
  const router = useRouter();
  const isEdit = !!post;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    slug: post?.slug || "",
    titleIt: post?.titleIt || "",
    titleEn: post?.titleEn || "",
    excerptIt: post?.excerptIt || "",
    excerptEn: post?.excerptEn || "",
    contentIt: post?.contentIt || "",
    contentEn: post?.contentEn || "",
    coverImage: post?.coverImage || "",
    category: post?.category || "",
    isPublished: post?.isPublished ?? false,
  });

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[àáâãäå]/g, "a").replace(/[èéêë]/g, "e")
      .replace(/[ìíîï]/g, "i").replace(/[òóôõö]/g, "o").replace(/[ùúûü]/g, "u")
      .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEdit ? `/api/admin/blog/${post!.id}` : "/api/admin/blog";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isEdit ? "Articolo aggiornato" : "Articolo creato");
      router.push(`/${lang}/admin/blog`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !confirm("Eliminare questo articolo?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/${post!.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Articolo eliminato");
      router.push(`/${lang}/admin/blog`);
    } catch {
      toast.error("Errore durante l'eliminazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Metadata */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-stone-700">Metadati</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Slug URL *</Label>
              <Input
                required
                value={form.slug}
                onChange={e => set("slug", e.target.value)}
                placeholder="il-mio-articolo"
              />
              <p className="text-xs text-stone-400">URL: /it/blog/{form.slug || "..."}</p>
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="es. Vini, Collezionismo, News" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Immagine di copertina (URL)</Label>
            <Input value={form.coverImage} onChange={e => set("coverImage", e.target.value)} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={form.isPublished}
              onChange={e => set("isPublished", e.target.checked)}
              className="accent-amber-500"
            />
            <label htmlFor="published" className="text-sm font-medium text-stone-700">Pubblica articolo</label>
          </div>
        </CardContent>
      </Card>

      {/* Italian content */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-stone-700">🇮🇹 Contenuto Italiano</h3>
          <div className="space-y-1">
            <Label>Titolo *</Label>
            <Input
              required
              value={form.titleIt}
              onChange={e => {
                set("titleIt", e.target.value);
                if (!isEdit && !form.slug) set("slug", generateSlug(e.target.value));
              }}
              placeholder="Titolo dell'articolo"
            />
          </div>
          <div className="space-y-1">
            <Label>Estratto</Label>
            <textarea
              value={form.excerptIt}
              onChange={e => set("excerptIt", e.target.value)}
              placeholder="Breve descrizione dell'articolo (max 200 caratteri)"
              maxLength={300}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-stone-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1">
            <Label>Contenuto *</Label>
            <textarea
              required
              value={form.contentIt}
              onChange={e => set("contentIt", e.target.value)}
              placeholder="Testo dell'articolo in italiano..."
              rows={12}
              className="w-full px-3 py-2 rounded-md border border-stone-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* English content */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-stone-700">🇬🇧 English Content</h3>
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input required value={form.titleEn} onChange={e => set("titleEn", e.target.value)} placeholder="Article title" />
          </div>
          <div className="space-y-1">
            <Label>Excerpt</Label>
            <textarea
              value={form.excerptEn}
              onChange={e => set("excerptEn", e.target.value)}
              placeholder="Short article description (max 200 characters)"
              maxLength={300}
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-stone-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1">
            <Label>Content *</Label>
            <textarea
              required
              value={form.contentEn}
              onChange={e => set("contentEn", e.target.value)}
              placeholder="Article content in English..."
              rows={12}
              className="w-full px-3 py-2 rounded-md border border-stone-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold">
          {loading ? "Salvataggio..." : (isEdit ? "Salva modifiche" : "Crea articolo")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/${lang}/admin/blog`)}>
          Annulla
        </Button>
        {isEdit && (
          <Button type="button" variant="outline" onClick={handleDelete} disabled={loading} className="text-red-600 border-red-200 hover:bg-red-50 ml-auto">
            Elimina
          </Button>
        )}
      </div>
    </form>
  );
}
