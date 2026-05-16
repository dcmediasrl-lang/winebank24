"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check, X, Undo2 } from "lucide-react";

interface OfferActionsProps {
  offerId: string;
  mode: "seller" | "buyer";
}

export function OfferActions({ offerId, mode }: OfferActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function doAction(action: "accept" | "reject" | "withdraw") {
    setLoading(action);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Errore nell'operazione");
        return;
      }
      if (action === "accept") toast.success("Offerta accettata! Proprietà trasferita.");
      else if (action === "reject") toast.success("Offerta rifiutata.");
      else toast.success("Offerta ritirata.");
      router.refresh();
    } catch {
      toast.error("Errore di rete. Riprova.");
    } finally {
      setLoading(null);
    }
  }

  if (mode === "seller") {
    return (
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          onClick={() => doAction("accept")}
          disabled={!!loading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="w-4 h-4 mr-1" />
          {loading === "accept" ? "..." : "Accetta"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => doAction("reject")}
          disabled={!!loading}
          className="border-red-400 text-red-600 hover:bg-red-50"
        >
          <X className="w-4 h-4 mr-1" />
          {loading === "reject" ? "..." : "Rifiuta"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <Button
        size="sm"
        variant="outline"
        onClick={() => doAction("withdraw")}
        disabled={!!loading}
        className="border-stone-400 text-stone-600 hover:bg-stone-100"
      >
        <Undo2 className="w-4 h-4 mr-1" />
        {loading === "withdraw" ? "..." : "Ritira offerta"}
      </Button>
    </div>
  );
}
