"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Gem, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottleImageUploader, type UploadedImage } from "./bottle-image-uploader";
import { WineDenominationPicker } from "@/components/shared/wine-denomination-picker";

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
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [denominationId, setDenominationId] = useState<string | undefined>(undefined);
  const [denominationName, setDenominationName] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    vintage: new Date().getFullYear().toString(),
    grape: "",
    region: "",
    bottleNumber: "1",
    price: "",
    totalValue: "",
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function resetForm() {
    setForm({ name: "", description: "", vintage: new Date().getFullYear().toString(), grape: "", region: "", bottleNumber: "1", price: "", totalValue: "" });
    setImages([]);
    setIsFractionable(false);
    setDenominationId(undefined);
    setDenominationName("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Validate images
    const readyImages = images.filter(i => i.url);
    if (readyImages.length === 0) {
      toast.error("Carica almeno 1 foto della bottiglia (obbligatoria per contratto)");
      return;
    }
    if (images.some(i => i.uploading)) {
      toast.error("Attendi il completamento del caricamento immagini");
      return;
    }
    if (images.some(i => i.error)) {
      toast.error("Rimuovi le immagini con errore prima di procedere");
      return;
    }

    setLoading(true);
    try {
      const imageUrls = readyImages.map(i => i.url);
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
          imageUrl: imageUrls[0],
          imageGallery: imageUrls,
          isFractionable,
          totalValue: isFractionable && form.totalValue ? parseFloat(form.totalValue) : undefined,
          denominationId: denominationId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.onChain
        ? `Certificato creato su blockchain! Token ID: ${data.tokenId}`
        : "Certificato digitale creato con successo!");
      setOpen(false);
      resetForm();
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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white text-lg">
            <Gem className="w-5 h-5 text-amber-400" />
            Crea certificato digitale
          </DialogTitle>
          <p className="text-sm text-white/60">Ogni certificato rappresenta una singola bottiglia unica.</p>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5 pt-2">

          {/* Indisponibilità reminder */}
          <div className="flex gap-3 bg-red-950/60 border border-red-600/50 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 leading-relaxed">
              <strong className="text-red-300">Vincolo di indisponibilità:</strong> dal momento della creazione del certificato,
              la bottiglia fisica non può essere venduta, spostata, data in pegno o consumata
              fino alla liquidazione. Violazioni comportano una penale del <strong className="text-red-300">200%</strong> del valore.
            </p>
          </div>

          {/* Identità della bottiglia */}
          <div className="space-y-4 p-4 bg-[#2a1010] rounded-xl border border-white/15">
            <p className="text-xs font-bold text-amber-400/80 uppercase tracking-widest">Identità della bottiglia</p>

            <div className="space-y-1.5">
              <Label className="text-white font-medium">Nome del vino <span className="text-red-400">*</span></Label>
              <Input
                required
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="es. Barolo Riserva DOCG"
                className="border-white/20 bg-black/30 text-white placeholder:text-white/30 focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white font-medium">
                Denominazione{" "}
                <span className="text-white/45 font-normal text-xs">(opzionale — cerca DOC/DOCG)</span>
              </Label>
              <WineDenominationPicker
                value={denominationName}
                onSelect={(d) => {
                  setDenominationId(d.id);
                  setDenominationName(d.name);
                  if (!form.region) set("region", d.region);
                  if (!form.grape && d.grapes.length === 1) set("grape", d.grapes[0]);
                }}
              />
              {denominationId && (
                <p className="text-xs text-amber-400">
                  Collegato a: <span className="font-semibold">{denominationName}</span>
                  <button
                    type="button"
                    onClick={() => { setDenominationId(undefined); setDenominationName(""); }}
                    className="ml-2 text-white/30 hover:text-red-400 transition-colors"
                  >
                    ✕ rimuovi
                  </button>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white font-medium">Annata <span className="text-red-400">*</span></Label>
                <Input
                  required
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={form.vintage}
                  onChange={e => set("vintage", e.target.value)}
                  className="border-white/20 bg-black/30 text-white focus:border-amber-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white font-medium">N° bottiglia <span className="text-red-400">*</span></Label>
                <Input
                  required
                  type="number"
                  min="1"
                  value={form.bottleNumber}
                  onChange={e => set("bottleNumber", e.target.value)}
                  placeholder="es. 1"
                  className="border-white/20 bg-black/30 text-white placeholder:text-white/30 focus:border-amber-500"
                />
                <p className="text-xs text-white/40">Numero seriale univoco</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white font-medium">Vitigno</Label>
                <select
                  value={form.grape}
                  onChange={e => set("grape", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-white/20 bg-black/30 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="" className="bg-[#1a0f0f]">Seleziona...</option>
                  {GRAPES.map(g => <option key={g} value={g} className="bg-[#1a0f0f]">{g}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-white font-medium">Regione</Label>
                <select
                  value={form.region}
                  onChange={e => set("region", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-white/20 bg-black/30 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="" className="bg-[#1a0f0f]">Seleziona...</option>
                  {REGIONS.map(r => <option key={r} value={r} className="bg-[#1a0f0f]">{r}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-white font-medium">
                Descrizione{" "}
                <span className="text-white/45 font-normal text-xs">(opzionale)</span>
              </Label>
              <textarea
                value={form.description}
                onChange={e => set("description", e.target.value)}
                placeholder="Caratteristiche, note di degustazione, storia..."
                rows={2}
                className="w-full px-3 py-2 rounded-md border border-white/20 bg-black/30 text-white placeholder:text-white/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-white font-medium">
                Foto della bottiglia <span className="text-red-400 font-semibold">*</span>{" "}
                <span className="text-white/45 font-normal text-xs">(1–4 immagini)</span>
              </Label>
              <BottleImageUploader
                images={images}
                onChange={setImages}
                disabled={loading}
              />
            </div>
          </div>

          {/* Tipologia certificato */}
          <div className="space-y-4 p-4 bg-[#2a1010] rounded-xl border border-white/15">
            <p className="text-xs font-bold text-amber-400/80 uppercase tracking-widest">Tipologia certificato</p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsFractionable(false)}
                className={cn(
                  "flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all",
                  !isFractionable
                    ? "border-amber-500 bg-amber-950/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-white/15 hover:border-white/30 bg-black/20"
                )}
              >
                <span className="font-bold text-sm text-white">Proprietà intera</span>
                <span className="text-xs text-white/55 mt-1 leading-relaxed">Un solo collezionista acquista la bottiglia completa</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFractionable(true)}
                className={cn(
                  "flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all",
                  isFractionable
                    ? "border-amber-500 bg-amber-950/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-white/15 hover:border-white/30 bg-black/20"
                )}
              >
                <span className="font-bold text-sm text-white">Co-proprietà</span>
                <span className="text-xs text-white/55 mt-1 leading-relaxed">Più collezionisti possono acquisire quote della stessa bottiglia</span>
              </button>
            </div>

            {!isFractionable ? (
              <div className="space-y-1.5">
                <Label className="text-white font-medium">
                  Prezzo di vendita (€){" "}
                  <span className="text-white/45 font-normal text-xs">(lascia vuoto per non mettere in vendita)</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={e => set("price", e.target.value)}
                  placeholder="es. 250.00"
                  className="border-white/20 bg-black/30 text-white placeholder:text-white/30 focus:border-amber-500"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-white font-medium">Valore totale della bottiglia (€) <span className="text-red-400">*</span></Label>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={form.totalValue}
                  onChange={e => set("totalValue", e.target.value)}
                  placeholder="es. 1000.00"
                  className="border-white/20 bg-black/30 text-white placeholder:text-white/30 focus:border-amber-500"
                />
                <p className="text-xs text-white/50">I collezionisti potranno acquisire qualsiasi quota fino al valore totale.</p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-base py-5"
          >
            {loading ? "Creazione in corso..." : "Crea certificato digitale"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
