"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ShoppingCart, AlertTriangle, CheckCircle } from "lucide-react";
import { CONTRACT_BUYER_VERSION } from "@/lib/contracts";
import { KycGateDialog } from "@/components/collector/kyc-gate-dialog";

export function BuyButton({
  nftId,
  price,
  nftName,
  isLoggedIn,
  needsTermsAcceptance = false,
  kycComplete: kycCompleteProp = true,
}: {
  nftId: string;
  price: number;
  nftName: string;
  isLoggedIn: boolean;
  needsTermsAcceptance?: boolean;
  kycComplete?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(!needsTermsAcceptance);
  const [checks, setChecks] = useState({ c1: false, c2: false, c3: false, c4: false });
  const [showKyc, setShowKyc] = useState(false);
  const [kycDone, setKycDone] = useState(kycCompleteProp);
  const allChecked = Object.values(checks).every(Boolean);
  const toggle = (k: keyof typeof checks) => setChecks(p => ({ ...p, [k]: !p[k] }));

  async function acceptTerms() {
    setLoading(true);
    try {
      const res = await fetch("/api/collector/accept-terms", { method: "POST" });
      if (!res.ok) throw new Error();
      setTermsAccepted(true);
      setShowTerms(false);
      toast.success("Termini accettati. Procedi con l'acquisto.");
      router.refresh();
    } catch {
      toast.error("Errore durante l'accettazione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  async function doBuy() {
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

  function buy() {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (!kycDone) { setShowKyc(true); return; }
    if (!termsAccepted) { setShowTerms(true); return; }
    doBuy();
  }

  function handleKycComplete() {
    setKycDone(true);
    setShowKyc(false);
    if (!termsAccepted) {
      setShowTerms(true);
    } else {
      doBuy();
    }
  }

  return (
    <>
      <Button onClick={buy} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold">
        <ShoppingCart className="w-4 h-4 mr-2" />
        {loading ? "Reindirizzamento..." : `Acquista · € ${price.toFixed(2)}`}
      </Button>

      {/* KYC gate dialog */}
      <KycGateDialog open={showKyc} onOpenChange={setShowKyc} onComplete={handleKycComplete} />

      {/* Terms acceptance dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Prima di acquistare — Termini d&apos;Uso</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-amber-800 text-xs leading-relaxed">
                Prima del tuo primo acquisto su Wine Bank 24, devi prendere visione e accettare le dichiarazioni
                qui sotto. Vengono registrate una volta sola.
              </p>
            </div>

            <div className="space-y-3 bg-stone-50 rounded-lg p-4 border border-stone-200">
              <p className="font-semibold text-stone-900 text-xs uppercase tracking-wide">
                Acquisto del certificato: {nftName}
              </p>

              {([
                {
                  key: "c1",
                  text: "Acquisto il certificato digitale esclusivamente come bene da collezione. Non si tratta di un investimento finanziario, né di uno strumento regolamentato ai sensi della Direttiva MiFID II o di qualsiasi altra normativa sui servizi di investimento.",
                },
                {
                  key: "c2",
                  text: "Il certificato non mi attribuisce alcun diritto reale sulla bottiglia fisica (non sono proprietario dell'immobile, non è un diritto reale di godimento). Ho un diritto contrattuale digitale di proprietà collezionistica, certificato dalla piattaforma.",
                },
                {
                  key: "c3",
                  text: "Non ho diritto al ritiro fisico della bottiglia, salvo che io detenga il 100% della proprietà (certificato intero o tutte le quote di co-proprietà) e abbia completato la procedura di liquidazione prevista.",
                },
                {
                  key: "c4",
                  text: "Wine Bank 24 non garantisce, non promette e non suggerisce alcun apprezzamento di valore. Il prezzo di mercato dei beni da collezione può aumentare o diminuire. Acquisto esclusivamente per finalità collezionistiche.",
                },
              ] as { key: keyof typeof checks; text: string }[]).map(({ key, text }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                      checks[key] ? "bg-amber-500 border-amber-500" : "border-stone-300 group-hover:border-amber-400"
                    }`}
                    onClick={() => toggle(key)}
                  >
                    {checks[key] && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-stone-700 leading-relaxed text-xs">{text}</span>
                </label>
              ))}
            </div>

            <p className="text-xs text-stone-400">
              Versione termini: {CONTRACT_BUYER_VERSION} · Accettazione registrata con data e IP
            </p>

            <Button
              onClick={acceptTerms}
              disabled={!allChecked || loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold disabled:opacity-40"
            >
              {loading ? "Registrazione..." : "Accetto e procedo con l'acquisto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
