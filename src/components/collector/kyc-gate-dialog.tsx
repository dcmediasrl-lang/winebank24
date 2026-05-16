"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

const COUNTRIES = [
  // UE
  { code: "IT", name: "Italia", group: "UE" },
  { code: "DE", name: "Germania", group: "UE" },
  { code: "FR", name: "Francia", group: "UE" },
  { code: "ES", name: "Spagna", group: "UE" },
  { code: "NL", name: "Paesi Bassi", group: "UE" },
  { code: "BE", name: "Belgio", group: "UE" },
  { code: "AT", name: "Austria", group: "UE" },
  { code: "PT", name: "Portogallo", group: "UE" },
  { code: "GR", name: "Grecia", group: "UE" },
  { code: "PL", name: "Polonia", group: "UE" },
  // Extra UE
  { code: "CH", name: "Svizzera", group: "Extra UE" },
  { code: "GB", name: "Regno Unito", group: "Extra UE" },
  { code: "US", name: "Stati Uniti", group: "Extra UE" },
  { code: "OTHER", name: "Altro", group: "Extra UE" },
];

const EU_CODES = new Set(["IT","DE","FR","ES","NL","BE","AT","PT","GR","PL"]);

function taxIdLabel(country: string): string {
  if (country === "IT") return "Codice Fiscale";
  if (EU_CODES.has(country)) return "Codice fiscale estero o numero documento d'identità";
  return "Numero passaporto";
}

function taxIdPlaceholder(country: string): string {
  if (country === "IT") return "RSSMRA80A01H501U";
  if (EU_CODES.has(country)) return "es. DE123456789";
  return "es. AA1234567";
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void; // called after KYC saved — proceed with original action
}

export function KycGateDialog({ open, onOpenChange, onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", birthDate: "", country: "IT", fiscalCode: "",
  });

  const maxBirthDate = new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000)
    .toISOString().split("T")[0];

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Dati salvati. Procedi con l'operazione.");
      onOpenChange(false);
      onComplete();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore nel salvataggio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            Completa il tuo profilo
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-stone-500 -mt-1 leading-relaxed">
          Per effettuare acquisti o offerte su Wine Bank 24 è necessario completare
          la verifica anagrafica. I dati vengono richiesti una sola volta.
        </p>

        <form onSubmit={save} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome *</Label>
              <Input required value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Mario" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cognome *</Label>
              <Input required value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Rossi" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Data di nascita * <span className="text-stone-400">(devi avere almeno 18 anni)</span></Label>
            <Input
              required
              type="date"
              max={maxBirthDate}
              value={form.birthDate}
              onChange={e => set("birthDate", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Paese di residenza *</Label>
            <select
              required
              value={form.country}
              onChange={e => set("country", e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {["UE", "Extra UE"].map(group => (
                <optgroup key={group} label={group}>
                  {COUNTRIES.filter(c => c.group === group).map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">{taxIdLabel(form.country)} *</Label>
            <Input
              required
              value={form.fiscalCode}
              onChange={e => set("fiscalCode", form.country === "IT" ? e.target.value.toUpperCase() : e.target.value)}
              placeholder={taxIdPlaceholder(form.country)}
              maxLength={form.country === "IT" ? 16 : 30}
            />
            {form.country !== "IT" && (
              <p className="text-xs text-stone-400">
                {EU_CODES.has(form.country)
                  ? "Inserisci il codice fiscale del tuo paese o il numero del documento d'identità."
                  : "Inserisci il numero del tuo passaporto in corso di validità."}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold mt-2"
          >
            {loading ? "Salvataggio..." : "Salva e procedi"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
