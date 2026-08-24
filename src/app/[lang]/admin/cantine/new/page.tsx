"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Wine, User, Mail, MapPin, Globe, Receipt,
  ArrowLeft, CheckCircle, Send, Percent,
} from "lucide-react";

const REGIONS = [
  "Piemonte", "Toscana", "Veneto", "Lombardia", "Sicilia",
  "Campania", "Puglia", "Sardegna", "Trentino-Alto Adige",
  "Friuli-Venezia Giulia", "Lazio", "Emilia-Romagna",
  "Marche", "Umbria", "Abruzzo", "Calabria", "Basilicata",
  "Molise", "Valle d'Aosta", "Liguria",
];

export default function NewCantinaPage() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    cantinaName: "",
    description: "",
    location: "",
    vatNumber: "",
    website: "",
    royaltyPct: "5",
    contactName: "",
    email: "",
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cantine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          royaltyPct: parseFloat(form.royaltyPct) || 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      toast.success(`Cantina "${form.cantinaName}" creata con successo!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore nella creazione");
    } finally {
      setLoading(false);
    }
  }

  const sectionClass = "space-y-4 p-5 bg-[#2a1010] rounded-xl border border-white/15";
  const headerClass = "text-xs font-bold text-amber-400/80 uppercase tracking-widest mb-1";

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-950/50 border-2 border-green-500/50 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Cantina creata!</h2>
          <p className="text-white/60">
            <strong className="text-white">{form.cantinaName}</strong> è ora attiva su Wine Bank 24.
          </p>
          <p className="text-white/50 text-sm mt-2 flex items-center justify-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-amber-400" />
            Email con il link di attivazione inviata a <span className="text-amber-400">{form.email}</span>
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => { setDone(false); setForm({ cantinaName: "", description: "", location: "", vatNumber: "", website: "", royaltyPct: "5", contactName: "", email: "" }); }}
            className="border-white/20 text-white hover:bg-white/10"
          >
            + Crea un&apos;altra cantina
          </Button>
          <Button
            onClick={() => router.push(`/${lang}/admin/cantine`)}
            className="bg-[var(--wine-gradient)] text-white"
            style={{ background: "var(--wine-gradient)" }}
          >
            Vai alla lista cantine
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/${lang}/admin/cantine`)}
          className="w-9 h-9 rounded-lg border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wine className="w-6 h-6 text-amber-400" />
            Nuova Cantina
          </h1>
          <p className="text-white/50 text-sm">Crea un account cantina e invia il link di attivazione via email</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">

        {/* Dati cantina */}
        <div className={sectionClass}>
          <p className={headerClass}>Dati cantina</p>

          <div className="space-y-1.5">
            <Label className="text-white font-semibold flex items-center gap-1.5">
              <Wine className="w-3.5 h-3.5 text-amber-400" /> Nome cantina <span className="text-red-400">*</span>
            </Label>
            <Input
              required
              value={form.cantinaName}
              onChange={e => set("cantinaName", e.target.value)}
              placeholder="es. Cantina Marchesi di Barolo"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-white font-semibold">Descrizione</Label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Breve presentazione della cantina, storia, territorio..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-white/20 bg-black/30 text-white placeholder:text-white/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Regione / Località
              </Label>
              <select
                value={form.location}
                onChange={e => set("location", e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-white/20 bg-black/30 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="" className="bg-[#1a0f0f]">Seleziona regione...</option>
                {REGIONS.map(r => <option key={r} value={r} className="bg-[#1a0f0f]">{r}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white font-semibold flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-400" /> Partita IVA
              </Label>
              <Input
                value={form.vatNumber}
                onChange={e => set("vatNumber", e.target.value)}
                placeholder="IT12345678901"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-white font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" /> Sito web
              </Label>
              <Input
                type="url"
                value={form.website}
                onChange={e => set("website", e.target.value)}
                placeholder="https://www.cantina.it"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white font-semibold flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-amber-400" /> Royalty cessioni (%)
              </Label>
              <Input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={form.royaltyPct}
                onChange={e => set("royaltyPct", e.target.value)}
                placeholder="5"
              />
              <p className="text-xs text-white/40">% riconosciuta alla cantina su ogni cessione secondaria</p>
            </div>
          </div>
        </div>

        {/* Referente */}
        <div className={sectionClass}>
          <p className={headerClass}>Referente</p>

          <div className="space-y-1.5">
            <Label className="text-white font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" /> Nome referente <span className="text-red-400">*</span>
            </Label>
            <Input
              required
              value={form.contactName}
              onChange={e => set("contactName", e.target.value)}
              placeholder="es. Mario Rossi"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-white font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-400" /> Email <span className="text-red-400">*</span>
            </Label>
            <Input
              required
              type="email"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="cantina@email.com"
            />
          </div>
        </div>

        {/* Attivazione */}
        <div className="flex items-start gap-3 p-4 bg-[#2a1010] rounded-xl border border-white/15">
          <Send className="w-5 h-5 mt-0.5 text-amber-400 shrink-0" />
          <div>
            <p className="text-white font-semibold text-sm">Attivazione via email</p>
            <p className="text-white/50 text-xs mt-0.5">
              A <span className="text-amber-400">{form.email || "cantina@email.com"}</span> arriverà un link, valido 48 ore,
              con cui la cantina imposta da sola la propria password. Nessuna credenziale viaggia via email.
            </p>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full font-bold text-base py-5 text-white"
          style={{ background: "var(--wine-gradient)" }}
        >
          {loading ? "Creazione in corso..." : "Crea account cantina"}
        </Button>

      </form>
    </div>
  );
}
