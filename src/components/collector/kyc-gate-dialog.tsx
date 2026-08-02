"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { TAX_ID_SPECS, getTaxIdSpec, validateTaxId } from "@/lib/tax-id";

const MAX_BIRTH_DATE = new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000)
  .toISOString().split("T")[0];

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

  const maxBirthDate = MAX_BIRTH_DATE;
  const spec = getTaxIdSpec(form.country);

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    const taxError = validateTaxId(form.country, form.fiscalCode, {
      firstName: form.firstName,
      lastName: form.lastName,
      birthDate: new Date(form.birthDate),
    });
    if (taxError) {
      toast.error(taxError);
      return;
    }

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
            <Label className="text-xs">Paese di provenienza *</Label>
            <select
              required
              value={form.country}
              onChange={e => set("country", e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {TAX_ID_SPECS.map(s => (
                <option key={s.country} value={s.country}>{s.nameIt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">{spec?.labelIt} *</Label>
            <Input
              required
              value={form.fiscalCode}
              onChange={e => set("fiscalCode", e.target.value.toUpperCase())}
              placeholder={spec?.placeholder}
              maxLength={30}
              className="uppercase"
            />
            <p className="text-xs text-stone-400">
              Il codice viene verificato automaticamente con i tuoi dati anagrafici.
            </p>
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
