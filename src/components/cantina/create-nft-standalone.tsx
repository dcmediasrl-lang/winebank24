"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Gem } from "lucide-react";
import { useRouter } from "next/navigation";

const GRAPES = [
  "Nebbiolo", "Sangiovese", "Barolo", "Barbaresco", "Brunello",
  "Primitivo", "Aglianico", "Nero d'Avola", "Montepulciano",
  "Pinot Nero", "Merlot", "Cabernet Sauvignon", "Syrah",
  "Vermentino", "Fiano", "Greco", "Falanghina", "Garganega",
  "Trebbiano", "Chardonnay", "Altro",
];

const REGIONS = [
  "Piemonte", "Toscana", "Veneto", "Lombardia", "Sicilia",
  "Campania", "Puglia", "Sardegna", "Trentino-Alto Adige",
  "Friuli-Venezia Giulia", "Lazio", "Emilia-Romagna", "Altro",
];

export function CreateNftStandalone({ cantinaId }: { cantinaId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFractionable, setIsFractionable] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    vintage: new Date().getFullYear().toString(),
    grape: "",
    region: "",
    bottleNumber: "1",
    price: "",
    imageUrl: "",
    totalValue: "",
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/cantina/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cantinaId,
          name: form.name,
          description: form.description || undefined,
          vintage: parseInt(form.vintage) || undefined,
          grape: form.grape || undefined,
          region: form.region || undefined,
          bottleNumber: parseInt(form.bottleNumber),
          price: !isFractionable && form.price ? parseFloat(form.price) : undefined,
          imageUrl: form.imageUrl.trim() || undefined,
          isFractionable,
          totalValue: isFractionable && form.totalValue ? parseFloat(form.totalValue) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.onChain
        ? `Certificato creato su blockchain! Token ID: ${data.tokenId}`
        : "Certificato digitale creato con successo!");
      setOpen(false);
      setForm({ name: "", description: "", vintage: new Date().getFullYear().toString(), grape: "", region: "", bottleNumber: "1", price: "", imageUrl: "", totalValue: "" });
      setIsFractionable(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore nella creazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants(), "bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold")}>
        <Plus className="w-4 h-4 mr-2" /> Nuovo certificato
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gem className="w-5 h-5 text-amber-500" />
            Crea certificato digitale
          </DialogTitle>
          <p className="text-sm text-stone-500">Ogni certificato rappresenta una singola bottiglia unica.</p>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 pt-2">

          {/* Identità della bottiglia */}
          <div className="space-y-3 p-4 bg-stone-50 rounded-lg">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Identità della bottiglia</p>

            <div className="space-y-1">
              <Label>Nome del vino *</Label>
              <Input
                required
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="es. Barolo Riserva DOCG"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Annata *</Label>
                <Input
                  required
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={form.vintage}
                  onChange={e => set("vintage", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>N° bottiglia *</Label>
                <Input
                  required
                  type="number"
                  min="1"
                  value={form.bottleNumber}
                  onChange={e => set("bottleNumber", e.target.value)}
                  placeholder="es. 1"
                />
                <p className="text-xs text-stone-400">Numero seriale univoco</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Vitigno</Label>
                <select
                  value={form.grape}
                  onChange={e => set("grape", e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Seleziona...</option>
                  {GRAPES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Regione</Label>
                <select
                  value={form.region}
                  onChange={e => set("region", e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Seleziona...</option>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Descrizione <span className="text-stone-400 font-normal">(opzionale)</span></Label>
              <textarea
                value={form.description}
                onChange={e => set("description", e.target.value)}
                placeholder="Caratteristiche, note di degustazione, storia..."
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-stone-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <Label>Foto della bottiglia (URL) <span className="text-stone-400 font-normal">(opzionale)</span></Label>
              <Input
                type="url"
                value={form.imageUrl}
                onChange={e => set("imageUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Tipologia certificato */}
          <div className="space-y-3 p-4 bg-stone-50 rounded-lg">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Tipologia certificato</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsFractionable(false)}
                className={cn(
                  "flex flex-col items-start p-3 rounded-lg border-2 text-left transition-colors",
                  !isFractionable
                    ? "border-amber-500 bg-amber-50"
                    : "border-stone-200 hover:border-stone-300"
                )}
              >
                <span className="font-semibold text-sm text-stone-900">Proprietà intera</span>
                <span className="text-xs text-stone-500 mt-0.5">Un solo collezionista acquista la bottiglia completa</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFractionable(true)}
                className={cn(
                  "flex flex-col items-start p-3 rounded-lg border-2 text-left transition-colors",
                  isFractionable
                    ? "border-amber-500 bg-amber-50"
                    : "border-stone-200 hover:border-stone-300"
                )}
              >
                <span className="font-semibold text-sm text-stone-900">Co-proprietà</span>
                <span className="text-xs text-stone-500 mt-0.5">Più collezionisti possono acquisire quote della stessa bottiglia</span>
              </button>
            </div>

            {!isFractionable ? (
              <div className="space-y-1">
                <Label>Prezzo di vendita (€) <span className="text-stone-400 font-normal">(lascia vuoto per non mettere in vendita)</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={e => set("price", e.target.value)}
                  placeholder="es. 250.00"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Valore totale della bottiglia (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={form.totalValue}
                  onChange={e => set("totalValue", e.target.value)}
                  placeholder="es. 1000.00"
                />
                <p className="text-xs text-stone-500">I collezionisti potranno acquisire qualsiasi quota fino al valore totale.</p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
          >
            {loading ? "Creazione in corso..." : "Crea certificato digitale"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
