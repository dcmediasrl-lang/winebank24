"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Package, Lock, AlertTriangle, Euro } from "lucide-react";

export function DeliveryRequestButton({
  nftId,
  bottleValue,
  physicalDeliveryUnlocked,
  shippingCost,
  alreadyRequested,
  compact = false,
}: {
  nftId: string;
  nftName: string;
  bottleValue: number;
  physicalDeliveryUnlocked: boolean;
  shippingCost: number | null;
  alreadyRequested: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const burnFee = bottleValue * 0.05;
  const vat = burnFee * 0.22;
  const shipping = shippingCost ?? 0;
  const total = burnFee + vat + shipping;

  if (alreadyRequested) {
    return (
      <div className={`flex items-center gap-2 text-orange-400 text-sm ${compact ? "text-xs" : ""}`}>
        <Package className="w-4 h-4 shrink-0" />
        Ritiro richiesto — in attesa di evasione
      </div>
    );
  }

  if (!physicalDeliveryUnlocked) {
    return (
      <div className={`flex items-center gap-2 text-white/30 text-sm ${compact ? "text-xs" : ""}`}>
        <Lock className="w-4 h-4 shrink-0" />
        Ritiro fisico non ancora disponibile (la cantina deve abilitarlo)
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-xl border border-amber-700/40 bg-amber-950/20 text-amber-300 hover:border-amber-500 hover:bg-amber-950/40 transition-all ${
          compact
            ? "text-xs px-3 py-1.5"
            : "text-sm px-4 py-2.5 w-full justify-center font-medium"
        }`}
      >
        <Package className={compact ? "w-3 h-3" : "w-4 h-4"} />
        Richiedi bottiglia fisica
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              Richiedi la bottiglia fisica
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 text-sm">
            {/* Warning */}
            <div className="flex gap-3 p-3 rounded-lg bg-red-950/40 border border-red-700/40">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs leading-relaxed">
                <strong>Attenzione:</strong> il certificato digitale verrà distrutto (burn) al completamento
                del pagamento. L&apos;operazione è irreversibile.
              </p>
            </div>

            {/* Cost breakdown */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
                <Euro className="w-3.5 h-3.5" /> Riepilogo costi
              </p>
              <div className="flex justify-between text-xs text-white/60">
                <span>Valore del certificato</span>
                <span>€ {bottleValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Fee di ritiro (5%)</span>
                <span className="text-white">€ {burnFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">IVA 22% sulla fee</span>
                <span className="text-white">€ {vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Spedizione</span>
                <span className="text-white">{shipping > 0 ? `€ ${shipping.toFixed(2)}` : "Inclusa"}</span>
              </div>
              <div className="flex justify-between font-bold text-white border-t border-white/10 pt-2.5">
                <span>Totale da pagare</span>
                <span className="text-amber-400">€ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Address form */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Indirizzo di consegna <span className="text-red-400">*</span></Label>
                <Textarea
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={3}
                  placeholder="Via Roma 1, 00100 Roma RM&#10;Italia"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Note per la consegna <span className="text-white/30 font-normal">(opzionale)</span></Label>
                <Input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Orari preferiti, citofono, istruzioni specifiche…"
                />
              </div>
            </div>

            <Button
              disabled={loading || !address.trim()}
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await fetch("/api/collector/burn-checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nftId, address, notes }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error);
                  window.location.href = data.checkoutUrl;
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : "Errore. Riprova.");
                  setLoading(false);
                }
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold"
            >
              {loading ? "Reindirizzamento a Stripe…" : `Paga € ${total.toFixed(2)} e richiedi bottiglia`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
