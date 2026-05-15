"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

export function BuyButton({ nftId, price, nftName, isLoggedIn }: {
  nftId: string; price: number; nftName: string; isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function buy() {
    if (!isLoggedIn) { router.push("/login"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nftId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore nel checkout");
      setLoading(false);
    }
  }

  return (
    <Button onClick={buy} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold">
      <ShoppingCart className="w-4 h-4 mr-2" />
      {loading ? "Reindirizzamento..." : `Acquista · € ${price.toFixed(2)}`}
    </Button>
  );
}
