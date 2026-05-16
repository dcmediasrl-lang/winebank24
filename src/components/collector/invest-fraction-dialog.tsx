"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

export function InvestFractionDialog({
  nftId,
  nftName,
  totalValue,
  availableValue,
  isLoggedIn,
}: {
  nftId: string;
  nftName: string;
  totalValue: number;
  availableValue: number;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const percentage = totalValue > 0 ? (parsedAmount / totalValue) * 100 : 0;

  async function invest(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/collector/fractions/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nftId, amount: parsedAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Investimento completato! Quota acquisita: ${data.percentage.toFixed(4)}%`);
      setOpen(false);
      setAmount("");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore nell'investimento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants(), "w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold")}>
        <TrendingUp className="w-4 h-4 mr-2" />
        Investi
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Investi in {nftName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={invest} className="space-y-4">
          <div className="rounded-lg bg-stone-100 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">Valore totale:</span>
              <span className="font-medium">€ {totalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Disponibile:</span>
              <span className="font-medium text-green-700">€ {availableValue.toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Importo da investire (€) *</Label>
            <Input
              type="number"
              step="0.01"
              min="1"
              max={availableValue}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
            />
          </div>
          {parsedAmount > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
              <p className="text-stone-600">
                Quota che acquisterai: <span className="font-bold text-amber-700">{percentage.toFixed(4)}%</span>
              </p>
            </div>
          )}
          <Button
            type="submit"
            disabled={loading || parsedAmount <= 0 || parsedAmount > availableValue}
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950"
          >
            {loading ? "Investimento in corso..." : "Conferma investimento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
