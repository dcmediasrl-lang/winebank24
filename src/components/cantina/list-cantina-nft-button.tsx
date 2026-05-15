"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ShoppingCart, EyeOff } from "lucide-react";

export function ListCantinaNftButton({ nftId, isListed, price }: {
  nftId: string; isListed: boolean; price: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newPrice, setNewPrice] = useState(price?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  async function toggleListing(listed: boolean, priceValue?: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/cantina/nfts/${nftId}/list`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isListed: listed, price: priceValue }),
      });
      if (!res.ok) throw new Error();
      toast.success(listed ? "NFT pubblicato nel marketplace!" : "NFT rimosso dal marketplace");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Errore nell'operazione");
    } finally {
      setLoading(false);
    }
  }

  if (isListed) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => toggleListing(false)}
        className="text-stone-600"
      >
        <EyeOff className="w-3 h-3 mr-1" /> Rimuovi dal marketplace
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm" }), "bg-amber-500 hover:bg-amber-600 text-stone-950")}>
        <ShoppingCart className="w-3 h-3 mr-1" /> Metti in vendita
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pubblica nel Marketplace</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Prezzo di vendita (€) *</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              placeholder="es. 150.00"
              autoFocus
            />
          </div>
          <Button
            onClick={() => toggleListing(true, parseFloat(newPrice))}
            disabled={loading || !newPrice || parseFloat(newPrice) <= 0}
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950"
          >
            {loading ? "Pubblicazione..." : "Pubblica nel Marketplace"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
