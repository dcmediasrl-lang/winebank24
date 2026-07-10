"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PackageCheck, PackageX, Lock, Unlock } from "lucide-react";

export function UnlockDeliveryButton({
  nftId,
  currentlyUnlocked,
  currentShippingCost,
}: {
  nftId: string;
  currentlyUnlocked: boolean;
  currentShippingCost: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shippingCost, setShippingCost] = useState(currentShippingCost?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  async function submit(unlock: boolean) {
    if (unlock && (!shippingCost || parseFloat(shippingCost) < 0)) {
      toast.error("Inserisci un costo di spedizione valido (anche 0 per gratis)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/cantina/nfts/${nftId}/unlock-delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unlock, shippingCost: parseFloat(shippingCost) || 0 }),
      });
      if (!res.ok) throw new Error();
      toast.success(unlock ? "Ritiro fisico abilitato per il collezionista" : "Ritiro fisico disabilitato");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Errore. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  if (currentlyUnlocked) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-green-700/40 text-green-400 hover:bg-green-900/20 transition-colors" title="Ritiro fisico abilitato">
          <Unlock className="w-3 h-3" /> Ritiro ON
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-green-400" />
              Ritiro fisico abilitato
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-white/60">
              Il collezionista può richiedere la consegna fisica della bottiglia.<br />
              Costo spedizione attuale: <span className="text-white font-semibold">€ {(currentShippingCost ?? 0).toFixed(2)}</span>
            </p>
            <div className="space-y-1.5">
              <Label>Modifica costo spedizione (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={shippingCost}
                onChange={e => setShippingCost(e.target.value)}
                placeholder="es. 15.00"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => submit(true)} disabled={loading} className="flex-1 bg-green-700 hover:bg-green-600 text-white text-sm">
                {loading ? "Salvataggio..." : "Aggiorna"}
              </Button>
              <Button onClick={() => submit(false)} disabled={loading} variant="destructive" className="flex-1 text-sm">
                <Lock className="w-3 h-3 mr-1" /> Disabilita ritiro
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-white/20 text-white/50 hover:border-amber-500 hover:text-amber-400 transition-colors" title="Abilita ritiro bottiglia fisica">
        <Lock className="w-3 h-3" /> Ritiro OFF
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageX className="w-5 h-5 text-white/60" />
            Abilita ritiro bottiglia fisica
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-white/60 leading-relaxed">
            Abilitando questa opzione, il collezionista potrà richiedere la consegna fisica della bottiglia.
            Il certificato verrà bruciato al completamento del pagamento.
          </p>
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-700/30 text-xs text-amber-300/80 leading-relaxed space-y-1">
            <p>Il collezionista pagherà:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-300/60">
              <li>Fee di ritiro: 2% del valore della bottiglia</li>
              <li>IVA: 22% sulla fee</li>
              <li>Costo spedizione: quanto imposti tu qui sotto</li>
            </ul>
          </div>
          <div className="space-y-1.5">
            <Label>Costo spedizione (€) <span className="text-red-400">*</span></Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={shippingCost}
              onChange={e => setShippingCost(e.target.value)}
              placeholder="es. 15.00 — oppure 0 se inclusa"
              autoFocus
            />
            <p className="text-xs text-white/30">Inserisci 0 se la spedizione è gratuita o inclusa nel servizio.</p>
          </div>
          <Button
            onClick={() => submit(true)}
            disabled={loading || shippingCost === ""}
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
          >
            {loading ? "Abilitazione..." : "Abilita ritiro fisico"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
