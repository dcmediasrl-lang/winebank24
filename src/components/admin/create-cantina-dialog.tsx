"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Wine } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateCantinaDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    cantinaName: "",
    location: "",
    vatNumber: "",
    website: "",
    contactName: "",
    email: "",
    password: "",
  });

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cantine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Cantina "${form.cantinaName}" creata con successo!`);
      setOpen(false);
      setForm({ cantinaName: "", location: "", vatNumber: "", website: "", contactName: "", email: "", password: "" });
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore nella creazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants(), "bg-amber-500 hover:bg-amber-600 text-stone-950")}>
        <Plus className="w-4 h-4 mr-2" /> Aggiungi Cantina
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wine className="w-5 h-5 text-amber-500" />
            <DialogTitle>Crea nuova Cantina</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">

          <div className="border rounded-lg p-3 space-y-3 bg-stone-50">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Dati cantina</p>
            <div className="space-y-1">
              <Label>Nome cantina *</Label>
              <Input required value={form.cantinaName} onChange={e => update("cantinaName", e.target.value)} placeholder="es. Cantina Marchesi di Barolo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Località</Label>
                <Input value={form.location} onChange={e => update("location", e.target.value)} placeholder="Barolo, Piemonte" />
              </div>
              <div className="space-y-1">
                <Label>Partita IVA</Label>
                <Input value={form.vatNumber} onChange={e => update("vatNumber", e.target.value)} placeholder="IT12345678901" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Sito web</Label>
              <Input type="url" value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://www.cantina.it" />
            </div>
          </div>

          <div className="border rounded-lg p-3 space-y-3 bg-stone-50">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Credenziali di accesso</p>
            <div className="space-y-1">
              <Label>Nome referente *</Label>
              <Input required value={form.contactName} onChange={e => update("contactName", e.target.value)} placeholder="Mario Rossi" />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input required type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="cantina@email.com" />
            </div>
            <div className="space-y-1">
              <Label>Password temporanea *</Label>
              <Input required type="text" minLength={6} value={form.password} onChange={e => update("password", e.target.value)} placeholder="min. 6 caratteri" />
              <p className="text-xs text-stone-400">Condividila con il referente della cantina in modo sicuro</p>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold">
            {loading ? "Creazione in corso..." : "Crea Cantina"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
