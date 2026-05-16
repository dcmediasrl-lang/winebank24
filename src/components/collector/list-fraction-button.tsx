"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

export function ListFractionButton({
  fractionId,
  isListed,
  askingPrice,
  ownedPercentage,
  investedAmount,
  listedPercentage,
}: {
  fractionId: string;
  isListed: boolean;
  askingPrice: number | null;
  ownedPercentage: number;   // e.g. 30 for 30%
  investedAmount: number;    // what the collector paid
  listedPercentage: number | null; // current listed portion
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sellPct, setSellPct] = useState(ownedPercentage.toFixed(4));
  const [price, setPrice] = useState(askingPrice?.toString() ?? "");

  const sellPctNum = parseFloat(sellPct) || 0;
  const isPartial = sellPctNum < ownedPercentage;
  const proportionalValue = investedAmount * (sellPctNum / ownedPercentage);
  const keepPct = Math.max(0, ownedPercentage - sellPctNum);

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
    if (sellPctNum <= 0 || sellPctNum > ownedPercentage) {
      toast.error(`Inserisci una percentuale tra 0.0001% e ${ownedPercentage}%`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/collector/fractions/${fractionId}/list`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isListed: true,
          askingPrice: parseFloat(price) || undefined,
          // Only send listedPercentage if it's a partial sale
          listedPercentage: isPartial ? sellPctNum : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isPartial
        ? `Quota parziale (${sellPctNum.toFixed(2)}%) messa in vendita`
        : "Quota messa in vendita"
      );
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  }

  if (isListed) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-amber-600 font-medium">
          {listedPercentage !== null
            ? `${listedPercentage.toFixed(2)}% in vendita`
            : "Quota in vendita"}
          {askingPrice !== null && ` · € ${askingPrice.toFixed(2)}`}
        </p>
        <Button size="sm" variant="outline" onClick={unlist} disabled={loading}>
          Rimuovi dalla vendita
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "sm" }), "bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold")}>
        Cedi quota
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cedi la tua quota</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">

          {/* Owned info */}
          <div className="bg-stone-50 rounded-lg px-4 py-3 text-sm">
            <p className="text-stone-500">Quota posseduta</p>
            <p className="font-semibold text-stone-900">{ownedPercentage.toFixed(2)}% · € {investedAmount.toFixed(2)}</p>
          </div>

          {/* Percentage to sell */}
          <div className="space-y-2">
            <Label>Percentuale da cedere</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={ownedPercentage}
                value={sellPct}
                onChange={e => setSellPct(e.target.value)}
                className="flex-1"
              />
              <span className="text-stone-500 text-sm shrink-0">%</span>
            </div>
            <input
              type="range"
              min="0"
              max={ownedPercentage}
              step="0.01"
              value={sellPct}
              onChange={e => setSellPct(e.target.value)}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-stone-400">
              <span>0%</span>
              <span>{ownedPercentage.toFixed(2)}%</span>
            </div>
          </div>

          {/* Summary */}
          {sellPctNum > 0 && (
            <div className={cn(
              "rounded-lg px-4 py-3 text-sm space-y-1 border",
              isPartial
                ? "bg-blue-50 border-blue-100"
                : "bg-amber-50 border-amber-100"
            )}>
              <div className="flex justify-between">
                <span className="text-stone-600">Cedi</span>
                <span className="font-semibold">{sellPctNum.toFixed(2)}%</span>
              </div>
              {isPartial && (
                <div className="flex justify-between">
                  <span className="text-stone-600">Mantieni</span>
                  <span className="font-semibold">{keepPct.toFixed(2)}%</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-stone-500 border-t pt-1 mt-1">
                <span>Valore proporzionale</span>
                <span>€ {proportionalValue.toFixed(2)}</span>
              </div>
              {isPartial && (
                <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                  <Info className="w-3 h-3 shrink-0" />
                  Vendita parziale — manterrai il {keepPct.toFixed(2)}% rimanente
                </div>
              )}
            </div>
          )}

          {/* Price */}
          <div className="space-y-1">
            <Label>Prezzo richiesto (€)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder={proportionalValue > 0 ? proportionalValue.toFixed(2) : "es. 100.00"}
            />
            <p className="text-xs text-stone-400">
              Valore proporzionale: € {proportionalValue.toFixed(2)}
            </p>
          </div>

          <Button
            onClick={list}
            disabled={loading || !price || sellPctNum <= 0 || sellPctNum > ownedPercentage}
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
          >
            {loading ? "Pubblicazione..." : `Metti in vendita ${sellPctNum.toFixed(2)}% · € ${price || "—"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
