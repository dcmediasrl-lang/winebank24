"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";

export function BuyFractionButton({
  fractionId,
  askingPrice,
  listedPercentage,
  totalPercentage,
  isLoggedIn,
}: {
  fractionId: string;
  askingPrice: number;
  listedPercentage: number | null;    // partial sale amount (or null = whole fraction)
  totalPercentage: number;            // seller's total owned percentage
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const displayPct = listedPercentage ?? totalPercentage;
  const isPartial = listedPercentage !== null && listedPercentage < totalPercentage;

  async function handleBuy() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/collector/fractions/${fractionId}/buy`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      toast.success(`${displayPct.toFixed(2)}% acquisito con successo!`);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore nell'acquisto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleBuy}
      disabled={loading}
      className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
    >
      <TrendingUp className="w-4 h-4 mr-2" />
      {loading
        ? "Acquisizione..."
        : `Acquisisci ${displayPct.toFixed(2)}%${isPartial ? " (parziale)" : ""} · € ${askingPrice.toFixed(2)}`}
    </Button>
  );
}
