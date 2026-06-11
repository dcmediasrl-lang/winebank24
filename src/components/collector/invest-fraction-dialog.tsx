"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, CheckCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { CONTRACT_BUYER_VERSION } from "@/lib/contracts";
import { KycGateDialog } from "@/components/collector/kyc-gate-dialog";

export function InvestFractionDialog({
  nftId,
  nftName,
  totalValue,
  availableValue,
  isLoggedIn,
  needsTermsAcceptance = false,
  kycComplete: kycCompleteProp = true,
}: {
  nftId: string;
  nftName: string;
  totalValue: number;
  availableValue: number;
  isLoggedIn: boolean;
  needsTermsAcceptance?: boolean;
  kycComplete?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"amount" | "terms">("amount");
  const [termsAccepted, setTermsAccepted] = useState(!needsTermsAcceptance);
  const [checks, setChecks] = useState({ c1: false, c2: false, c3: false, c4: false });
  const [showKyc, setShowKyc] = useState(false);
  const [kycDone, setKycDone] = useState(kycCompleteProp);
  const allChecked = Object.values(checks).every(Boolean);
  const toggle = (k: keyof typeof checks) => setChecks(p => ({ ...p, [k]: !p[k] }));

  const parsedAmount = parseFloat(amount) || 0;
  const percentage = totalValue > 0 ? (parsedAmount / totalValue) * 100 : 0;

  function handleDialogOpen() {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (!kycDone) { setShowKyc(true); return; }
    setStep("amount");
    setOpen(true);
  }

  function handleKycComplete() {
    setKycDone(true);
    setShowKyc(false);
    setStep("amount");
    setOpen(true);
  }

  async function acceptTermsAndInvest() {
    setLoading(true);
    try {
      const res = await fetch("/api/collector/accept-terms", { method: "POST" });
      if (!res.ok) throw new Error();
      setTermsAccepted(true);
      await doInvest();
    } catch {
      toast.error("Errore durante l'accettazione. Riprova.");
      setLoading(false);
    }
  }

  async function doInvest() {
    try {
      // Route through Stripe checkout for real payment processing
      const res = await fetch("/api/checkout/fraction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nftId, amount: parsedAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore nell'acquisto della quota");
      setLoading(false);
    }
  }

  async function invest(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) { router.push("/login"); return; }
    if (!termsAccepted) {
      setStep("terms");
      return;
    }
    setLoading(true);
    await doInvest();
  }

  return (
    <>
      {/* KYC gate dialog — rendered outside the main Dialog to avoid nesting issues */}
      <KycGateDialog open={showKyc} onOpenChange={setShowKyc} onComplete={handleKycComplete} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          className={cn(buttonVariants(), "w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold")}
          onClick={handleDialogOpen}
          type="button"
        >
          <Users className="w-4 h-4 mr-2" />
          Acquista quota
        </DialogTrigger>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === "terms" ? "Termini d'Uso — Lettura obbligatoria" : `Diventa co-proprietario di ${nftName}`}
            </DialogTitle>
          </DialogHeader>

          {step === "amount" ? (
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
                <Label>Importo per la quota (€) *</Label>
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
                    Quota che acquisterai:{" "}
                    <span className="font-bold text-amber-700">{percentage.toFixed(4)}%</span>
                  </p>
                </div>
              )}
              <Button
                type="submit"
                disabled={loading || parsedAmount <= 0 || parsedAmount > availableValue}
                className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950"
              >
                {loading ? "Acquisizione in corso..." : termsAccepted ? "Conferma acquisizione quota" : "Continua →"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-amber-800 text-xs leading-relaxed">
                  Prima del tuo primo acquisto su Wine Bank 24 devi accettare le seguenti dichiarazioni.
                  Vengono registrate una volta sola.
                </p>
              </div>

              <div className="space-y-3 bg-stone-50 rounded-lg p-3 border border-stone-200">
                <p className="font-semibold text-stone-900 text-xs uppercase tracking-wide">
                  Acquisto quota {percentage.toFixed(4)}% · € {parsedAmount.toFixed(2)}
                </p>

                {([
                  {
                    key: "c1",
                    text: "Acquisto questa quota come bene da collezione. Non si tratta di un investimento finanziario né di uno strumento regolamentato MiFID II.",
                  },
                  {
                    key: "c2",
                    text: "La quota non mi attribuisce un diritto reale di proprietà fisica. Ho un diritto contrattuale digitale di co-proprietà collezionistica.",
                  },
                  {
                    key: "c3",
                    text: "Non ho diritto al ritiro fisico della bottiglia in virtù di questa quota (possibile solo con il 100% della proprietà).",
                  },
                  {
                    key: "c4",
                    text: "Wine Bank 24 non garantisce alcun apprezzamento di valore. Il prezzo di mercato dei beni da collezione può aumentare o diminuire.",
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

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep("amount")} disabled={loading}>
                  ← Indietro
                </Button>
                <Button
                  onClick={acceptTermsAndInvest}
                  disabled={!allChecked || loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold disabled:opacity-40"
                >
                  {loading ? "In corso..." : "Accetto e acquisto"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
