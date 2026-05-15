"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ListNftButton({ nftId, isListed, price }: {
  nftId: string; isListed: boolean; price: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newPrice, setNewPrice] = useState(price?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  async function toggleListing() {
    setLoading(true);
    try {
      const res = await fetch(`/api/collector/nfts/${nftId}/list`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isListed: !isListed, price: parseFloat(newPrice) || undefined }),
      });
      if (!res.ok) throw new Error();
      toast.success(isListed ? "NFT rimosso dalla vendita" : "NFT messo in vendita!");
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
      <Button size="sm" variant="outline" onClick={toggleListing} disabled={loading} className="flex-1">
        Rimuovi dalla vendita
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm" }), "flex-1 bg-amber-500 hover:bg-amber-600 text-stone-950")}>
        Metti in vendita
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Imposta il prezzo di vendita</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Prezzo (€)</Label>
            <Input type="number" step="0.01" min="0" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="150.00" />
          </div>
          <Button onClick={toggleListing} disabled={loading || !newPrice} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950">
            {loading ? "Pubblicazione..." : "Pubblica sull'e-commerce"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
