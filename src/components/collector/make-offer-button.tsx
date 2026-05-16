"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";

interface MakeOfferButtonProps {
  nftId?: string;
  fractionId?: string;
  listedPrice: number;
  isLoggedIn: boolean;
  currentUserId?: string;
  sellerId: string;
}

export function MakeOfferButton({
  nftId,
  fractionId,
  listedPrice,
  isLoggedIn,
  currentUserId,
  sellerId,
}: MakeOfferButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [amountError, setAmountError] = useState("");

  const minOffer = listedPrice * 0.20;

  // Don't show if current user is the seller
  if (currentUserId && currentUserId === sellerId) return null;

  function validateAmount(val: string) {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      setAmountError("Inserisci un importo valido");
    } else if (num < minOffer) {
      setAmountError(
        `Offerta minima: € ${minOffer.toFixed(2)} (20% di € ${listedPrice.toFixed(2)})`
      );
    } else {
      setAmountError("");
    }
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    validateAmount(e.target.value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num < minOffer) {
      validateAmount(amount);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(nftId ? { nftId } : { fractionId }),
          amount: num,
          message: message.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("già un'offerta attiva")) {
          toast.error("Hai già un'offerta attiva su questo articolo. Ritirala prima di farne una nuova.");
        } else {
          toast.error(data.error ?? "Errore nella creazione dell'offerta");
        }
        return;
      }
      toast.success("Offerta inviata con successo!");
      setOpen(false);
      setAmount("");
      setMessage("");
      router.refresh();
    } catch {
      toast.error("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full border-amber-400 text-amber-700 hover:bg-amber-50"
        onClick={() => {
          if (!isLoggedIn) {
            router.push("/login");
            return;
          }
          setOpen(true);
        }}
      >
        <Tag className="w-4 h-4 mr-2" />
        Fai un&apos;offerta
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fai un&apos;offerta</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="rounded-md bg-stone-50 border border-stone-200 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Prezzo richiesto:</span>
                <span className="font-semibold text-stone-800">
                  € {listedPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Offerta minima (20%):</span>
                <span className="font-semibold text-amber-700">
                  € {minOffer.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">
                Il tuo importo (€)
              </label>
              <input
                type="number"
                step="0.01"
                min={minOffer}
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Min € ${minOffer.toFixed(2)}`}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
              {amountError && (
                <p className="text-xs text-red-600">{amountError}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">
                Messaggio al venditore{" "}
                <span className="text-stone-400 font-normal">(opzionale)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="Scrivi un messaggio al venditore..."
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
              <p className="text-xs text-stone-400 text-right">
                {message.length}/200
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !!amountError || !amount}
              className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold"
            >
              <Tag className="w-4 h-4 mr-2" />
              {loading ? "Invio in corso..." : "Invia offerta"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
