"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ListFractionButton({ fractionId, isListed, askingPrice }: {
  fractionId: string; isListed: boolean; askingPrice: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newPrice, setNewPrice] = useState(askingPrice?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  async function unlist() {
    setLoading(true);
    try {
      const res = await fetch(`/api/collector/fractions/${fractionId}/list`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isListed: false }),
      });
      if (!res.ok) throw new Error();
      toast.success("Quota rimossa dalla vendita");
      router.refresh();
    } catch {
      toast.error("Errore");
    } finally {
      setLoading(false);
    }
  }

  async function list() {
    setLoading(true);
    try {
      const res = await fetch(`/api/collector/fractions/${fractionId}/list`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isListed: true, askingPrice: parseFloat(newPrice) || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success("Quota ceduta con successo!");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Errore");
    } finally {
      setLoading(false);
    }
  }

  if (isListed) {
    return (
      <Button size="sm" variant="outline" onClick={unlist} disabled={loading} className="flex-1">
        Rimuovi dalla vendita
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm" }), "flex-1 bg-amber-500 hover:bg-amber-600 text-stone-950")}>
        Cedi la tua quota
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Cedi la tua quota</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Prezzo di vendita (€)</Label>
            <Input type="number" step="0.01" min="0" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="100.00" />
          </div>
          <Button onClick={list} disabled={loading || !newPrice} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950">
            {loading ? "Pubblicazione..." : "Cedi la tua quota"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
