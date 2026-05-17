"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WineDenomination {
  id: string;
  name: string;
  type: string;
  region: string;
  grapes: string[];
  wineTypes: string[];
  isActive: boolean;
}

const TYPE_BADGE: Record<string, string> = {
  DOCG: "bg-red-700 text-white",
  DOC: "bg-orange-600 text-white",
  IGT: "bg-gray-600 text-white",
};

const WINE_TYPE_OPTIONS = ["ROSSO", "BIANCO", "ROSATO", "SPUMANTE", "PASSITO"];

const REGIONS = [
  "Piemonte", "Valle d'Aosta", "Lombardia", "Trentino-Alto Adige",
  "Veneto", "Friuli-Venezia Giulia", "Liguria", "Emilia-Romagna",
  "Toscana", "Marche", "Umbria", "Lazio", "Abruzzo", "Molise",
  "Campania", "Puglia", "Basilicata", "Calabria", "Sicilia", "Sardegna",
];

export function WineDbManager({ initialDenominations }: { initialDenominations: WineDenomination[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "DOCG",
    region: "",
    grapes: "",
    wineTypes: [] as string[],
  });

  const filtered = initialDenominations.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.region.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase())
  );

  function toggleWineType(wt: string) {
    setForm((f) => ({
      ...f,
      wineTypes: f.wineTypes.includes(wt)
        ? f.wineTypes.filter((x) => x !== wt)
        : [...f.wineTypes, wt],
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const grapes = form.grapes
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
    if (grapes.length === 0) {
      toast.error("Inserisci almeno un vitigno");
      return;
    }
    if (form.wineTypes.length === 0) {
      toast.error("Seleziona almeno un tipo di vino");
      return;
    }
    try {
      const res = await fetch("/api/admin/wine-denominations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          region: form.region,
          grapes,
          wineTypes: form.wineTypes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Denominazione creata");
      setDialogOpen(false);
      setForm({ name: "", type: "DOCG", region: "", grapes: "", wineTypes: [] });
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questa denominazione?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/wine-denominations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Eliminata");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca denominazione, regione, tipo..."
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold text-sm shrink-0 transition-colors">
            <Plus className="w-4 h-4" /> Aggiungi
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nuova denominazione</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="es. Barolo"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tipo *</Label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="DOCG">DOCG</option>
                    <option value="DOC">DOC</option>
                    <option value="IGT">IGT</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Regione *</Label>
                  <select
                    required
                    value={form.region}
                    onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Seleziona...</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Vitigni * <span className="font-normal text-muted-foreground">(separati da virgola)</span></Label>
                <Input
                  required
                  value={form.grapes}
                  onChange={(e) => setForm((f) => ({ ...f, grapes: e.target.value }))}
                  placeholder="es. Nebbiolo, Sangiovese"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipi di vino *</Label>
                <div className="flex flex-wrap gap-2">
                  {WINE_TYPE_OPTIONS.map((wt) => (
                    <button
                      key={wt}
                      type="button"
                      onClick={() => toggleWineType(wt)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        form.wineTypes.includes(wt)
                          ? "bg-amber-500 border-amber-500 text-stone-950"
                          : "border-muted-foreground/30 text-muted-foreground hover:border-amber-500"
                      }`}
                    >
                      {wt}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold">
                Crea denominazione
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <p className="text-xs text-white/40">
        {filtered.length} / {initialDenominations.length} denominazioni
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--wine-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--wine-border)] text-[var(--wine-muted)] text-left">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Regione</th>
              <th className="px-4 py-3">Vitigni</th>
              <th className="px-4 py-3">Tipologie</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--wine-border)]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/30">
                  Nessuna denominazione trovata
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="hover:bg-[var(--wine-card-hover)]">
                  <td className="px-4 py-3 font-medium text-white">{d.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_BADGE[d.type] ?? "bg-gray-600 text-white"}`}>
                      {d.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70">{d.region}</td>
                  <td className="px-4 py-3 text-white/60 text-xs max-w-[180px]">
                    {d.grapes.join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {d.wineTypes.map((wt) => (
                        <span key={wt} className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                          {wt}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(d.id)}
                      disabled={deleting === d.id}
                      className="text-white/30 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
