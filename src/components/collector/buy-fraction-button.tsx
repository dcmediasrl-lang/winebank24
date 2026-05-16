"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";

export function BuyFractionButton({ fractionId, askingPrice, isLoggedIn }: {
  fractionId: string;
  askingPrice: number;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
      toast.success("Quota acquistata con successo!");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Errore nell'acquisto");
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
      {loading ? "Acquisizione..." : `Acquisisci quota · € ${askingPrice.toFixed(2)}`}
    </Button>
  );
}
