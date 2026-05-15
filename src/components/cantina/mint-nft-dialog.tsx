"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Gem } from "lucide-react";
import { useRouter } from "next/navigation";

export function MintNftDialog({ collectionId, cantinaId, collectionName }: {
  collectionId: string; cantinaId: string; collectionName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", bottleNumber: "", price: "", imageUrl: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/cantina/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          cantinaId,
          name: form.name,
          bottleNumber: parseInt(form.bottleNumber),
          price: parseFloat(form.price) || undefined,
          imageUrl: form.imageUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.onChain) {
        toast.success(`NFT mintato su blockchain! Token ID: ${data.tokenId}`);
      } else {
        toast.success("NFT creato con successo!");
      }
      setOpen(false);
      setForm({ name: "", bottleNumber: "", price: "", imageUrl: "" });
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore nel minting");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
        <Gem className="w-3 h-3 mr-2" /> Minta NFT
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Minta NFT — {collectionName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Nome NFT *</Label>
            <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="es. Barolo Riserva 2020 #001" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Numero bottiglia *</Label>
              <Input required type="number" min="1" value={form.bottleNumber} onChange={e => setForm(f => ({ ...f, bottleNumber: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Prezzo di vendita (€)</Label>
              <Input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="150.00" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>URL immagine bottiglia</Label>
            <Input type="url" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950">
            {loading ? "Minting in corso..." : "Minta sulla Blockchain"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
