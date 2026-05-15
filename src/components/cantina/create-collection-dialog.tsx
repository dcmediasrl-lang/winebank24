"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateCollectionDialog({ cantinaId }: { cantinaId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", vintage: "", grape: "", region: "", totalSupply: "1",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/cantina/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, cantinaId, vintage: parseInt(form.vintage) || undefined, totalSupply: parseInt(form.totalSupply) }),
      });
      if (!res.ok) throw new Error();
      toast.success("Collezione creata!");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Errore nella creazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants(), "bg-amber-500 hover:bg-amber-600 text-stone-950")}>
        <Plus className="w-4 h-4 mr-2" /> Nuova Collezione
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crea nuova collezione</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome collezione *</Label>
            <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="es. Barolo Riserva 2020" />
          </div>
          <div className="space-y-1">
            <Label>Descrizione</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Annata</Label>
              <Input type="number" value={form.vintage} onChange={e => setForm(f => ({ ...f, vintage: e.target.value }))} placeholder="2020" />
            </div>
            <div className="space-y-1">
              <Label>N° bottiglie totali *</Label>
              <Input required type="number" min="1" value={form.totalSupply} onChange={e => setForm(f => ({ ...f, totalSupply: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Vitigno</Label>
              <Input value={form.grape} onChange={e => setForm(f => ({ ...f, grape: e.target.value }))} placeholder="Nebbiolo" />
            </div>
            <div className="space-y-1">
              <Label>Regione</Label>
              <Input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} placeholder="Piemonte" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950">
            {loading ? "Creazione..." : "Crea Collezione"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
