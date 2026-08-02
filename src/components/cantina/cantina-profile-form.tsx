"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, ShieldCheck, ExternalLink } from "lucide-react";
import Image from "next/image";

type Cantina = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  website: string | null;
  logoUrl: string | null;
  vatNumber: string | null;
  isVerified: boolean;
  royaltyPct: number;
};

const SECTION = "bg-[#2a1010] rounded-xl border border-white/10 p-5 space-y-4";
const TEXTAREA = "w-full px-3 py-2.5 rounded-lg border border-white/20 bg-black/30 text-white placeholder:text-white/30 text-sm resize-none focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";

export function CantinaProfileForm({ cantina }: { lang: string; cantina: Cantina }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: cantina.name,
    description: cantina.description || "",
    location: cantina.location || "",
    website: cantina.website || "",
    logoUrl: cantina.logoUrl || "",
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/cantina/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Profilo aggiornato con successo!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Status */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1a0f0f] border border-[var(--wine-border)]">
        <ShieldCheck className={`w-5 h-5 ${cantina.isVerified ? "text-green-400" : "text-white/30"}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-white">
            {cantina.isVerified ? "Cantina verificata" : "In attesa di verifica"}
          </p>
          <p className="text-xs text-white/40">
            {cantina.isVerified
              ? "Il badge di verifica appare sul tuo profilo pubblico"
              : "Contatta l'amministratore per far verificare la cantina"}
          </p>
        </div>
        <Badge className={cantina.isVerified ? "bg-green-900/40 text-green-400 border-green-700/40" : "bg-white/5 text-white/40 border-white/10"}>
          {cantina.isVerified ? "Verificata" : "Non verificata"}
        </Badge>
      </div>

      {/* Dati principali */}
      <div className={SECTION}>
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Dati principali</p>

        <div className="space-y-1.5">
          <Label>Nome cantina *</Label>
          <Input
            required
            value={form.name}
            onChange={e => set("name", e.target.value)}
            placeholder="Nome della tua cantina"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Descrizione <span className="text-white/30 font-normal">(visibile sul profilo pubblico)</span></Label>
          <textarea
            value={form.description}
            onChange={e => set("description", e.target.value)}
            placeholder="Racconta la storia della tua cantina, la filosofia produttiva, il territorio…"
            rows={5}
            maxLength={2000}
            className={TEXTAREA}
          />
          <p className="text-xs text-white/30">{form.description.length}/2000 caratteri</p>
        </div>

        <div className="space-y-1.5">
          <Label>Localizzazione <span className="text-white/30 font-normal">(es. Barolo, Piemonte)</span></Label>
          <Input
            value={form.location}
            onChange={e => set("location", e.target.value)}
            placeholder="Comune, Regione"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Sito web</Label>
          <Input
            type="url"
            value={form.website}
            onChange={e => set("website", e.target.value)}
            placeholder="https://www.tuacantina.it"
          />
          {form.website && (
            <a
              href={form.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-500 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" /> Apri sito
            </a>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className={SECTION}>
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Logo</p>
        <div className="flex items-start gap-4">
          {form.logoUrl ? (
            <Image
              src={form.logoUrl}
              alt="Logo anteprima"
              width={80}
              height={80}
              className="w-20 h-20 rounded-xl object-contain bg-[#1a0f0f] border border-white/10 shrink-0"
              onError={() => set("logoUrl", "")}
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-[#1a0f0f] border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-2xl">🍷</span>
            </div>
          )}
          <div className="flex-1 space-y-1.5">
            <Label>URL immagine logo</Label>
            <Input
              type="url"
              value={form.logoUrl}
              onChange={e => set("logoUrl", e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-white/30">Incolla il link diretto all&apos;immagine del logo (PNG, JPG, SVG)</p>
          </div>
        </div>
      </div>

      {/* Info di sola lettura */}
      <div className={SECTION}>
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wide">Dati fiscali & commissioni</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/40 text-xs mb-1">Partita IVA</p>
            <p className="text-white font-mono">{cantina.vatNumber || "—"}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Royalty NFT</p>
            <p className="text-white font-mono">{cantina.royaltyPct}%</p>
          </div>
        </div>
        <p className="text-xs text-white/25">Per modificare P.IVA e royalty contatta l&apos;amministratore</p>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-3 text-base"
      >
        <Save className="w-4 h-4 mr-2" />
        {loading ? "Salvataggio…" : "Salva profilo"}
      </Button>
    </form>
  );
}
