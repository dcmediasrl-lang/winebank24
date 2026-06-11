"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Trash2, Eye, EyeOff } from "lucide-react";

type Post = {
  id: string;
  slug: string;
  titleIt: string;
  titleEn: string | null;
  excerptIt: string | null;
  excerptEn: string | null;
  contentIt: string;
  contentEn: string | null;
  coverImage: string | null;
  category: string | null;
  isPublished: boolean;
};

const SECTION = "bg-[#2a1010] rounded-xl border border-white/10 p-5 space-y-4";
const TEXTAREA = "w-full px-3 py-2.5 rounded-lg border border-white/20 bg-black/30 text-white placeholder:text-white/30 text-sm resize-none focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";

export function CantinaPostForm({ lang, post }: { lang: string; post?: Post }) {
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
      const url = isEdit ? `/api/cantina/blog/${post!.id}` : "/api/cantina/blog";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isEdit ? "Articolo aggiornato" : "Articolo pubblicato!");
      router.push(`/${lang}/cantina/blog`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !confirm("Eliminare definitivamente questo articolo?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cantina/blog/${post!.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Articolo eliminato");
      router.push(`/${lang}/cantina/blog`);
    } catch {
      toast.error("Errore durante l'eliminazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">

      {/* Metadati */}
      <div className={SECTION}>
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Metadati</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Slug URL *</Label>
            <Input
              required
              value={form.slug}
              onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="il-mio-articolo"
            />
            <p className="text-xs text-white/30">/it/blog/{form.slug || "…"}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Input
              value={form.category}
              onChange={e => set("category", e.target.value)}
              placeholder="es. Vini, News, Degustazioni"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Immagine di copertina (URL)</Label>
          <Input
            value={form.coverImage}
            onChange={e => set("coverImage", e.target.value)}
            placeholder="https://..."
          />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div
            className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.isPublished ? "bg-amber-500" : "bg-white/20"}`}
            onClick={() => set("isPublished", !form.isPublished)}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isPublished ? "translate-x-5" : "translate-x-0"}`} />
          </div>
          <span className="text-sm text-white/70 flex items-center gap-1.5">
            {form.isPublished
              ? <><Eye className="w-3.5 h-3.5 text-green-400" /> <span className="text-green-400">Articolo visibile nel blog</span></>
              : <><EyeOff className="w-3.5 h-3.5" /> Bozza (non pubblica)</>}
          </span>
        </label>
      </div>

      {/* Italiano (primario) */}
      <div className={SECTION}>
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">🇮🇹 Contenuto Italiano</p>
        <div className="space-y-1.5">
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
        <div className="space-y-1.5">
          <Label>Estratto <span className="text-white/30 font-normal">(opzionale)</span></Label>
          <textarea
            value={form.excerptIt}
            onChange={e => set("excerptIt", e.target.value)}
            placeholder="Breve introduzione all'articolo…"
            maxLength={400}
            rows={2}
            className={TEXTAREA}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Testo *</Label>
          <textarea
            required
            value={form.contentIt}
            onChange={e => set("contentIt", e.target.value)}
            placeholder="Scrivi il tuo articolo qui…"
            rows={14}
            className={TEXTAREA + " font-mono"}
          />
          <p className="text-xs text-white/30">Puoi usare testo semplice. La formattazione base (paragrafi) è supportata.</p>
        </div>
      </div>

      {/* Inglese (opzionale) */}
      <div className={SECTION}>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">🇬🇧 Versione Inglese <span className="text-white/25 normal-case font-normal">(opzionale — se vuoto usa il testo italiano)</span></p>
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input
            value={form.titleEn}
            onChange={e => set("titleEn", e.target.value)}
            placeholder="Article title in English"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Content</Label>
          <textarea
            value={form.contentEn}
            onChange={e => set("contentEn", e.target.value)}
            placeholder="Article content in English…"
            rows={8}
            className={TEXTAREA + " font-mono"}
          />
        </div>
      </div>

      {/* Azioni */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-6"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvataggio…" : isEdit ? "Salva modifiche" : "Pubblica articolo"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${lang}/cantina/blog`)}
          className="border-white/20 text-white/70"
        >
          Annulla
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={loading}
            className="ml-auto text-red-400 hover:bg-red-950 hover:text-red-300 px-3"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Elimina
          </Button>
        )}
      </div>
    </form>
  );
}
