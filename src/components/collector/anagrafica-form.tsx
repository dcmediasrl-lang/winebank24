"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TAX_ID_SPECS, getTaxIdSpec } from "@/lib/tax-id";

const MAX_BIRTH_DATE = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
  .toISOString().split("T")[0];

interface Props {
  lang: string;
  initial: {
    firstName: string;
    lastName: string;
    birthDate: string; // YYYY-MM-DD
    country: string;
    fiscalCode: string;
  };
}

export function AnagraficaForm({ lang, initial }: Props) {
  const router = useRouter();
  const en = lang === "en";
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);

  const spec = getTaxIdSpec(form.country);
  const codeLabel = spec ? (en ? spec.labelEn : spec.labelIt) : "";
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function set(field: keyof typeof form, value: string) {
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
      toast.success(en ? "Details updated." : "Anagrafica aggiornata.");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (en ? "Error saving" : "Errore nel salvataggio"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-xl space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{en ? "First name" : "Nome"} *</Label>
          <Input required value={form.firstName} onChange={e => set("firstName", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{en ? "Last name" : "Cognome"} *</Label>
          <Input required value={form.lastName} onChange={e => set("lastName", e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>{en ? "Date of birth" : "Data di nascita"} *</Label>
        <Input required type="date" max={MAX_BIRTH_DATE} value={form.birthDate} onChange={e => set("birthDate", e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label>{en ? "Country" : "Paese di provenienza"} *</Label>
        <select
          required
          value={form.country}
          onChange={e => set("country", e.target.value)}
          className="w-full h-9 px-3 rounded-md border border-[var(--wine-border)] bg-[var(--wine-card)] text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {TAX_ID_SPECS.map(s => (
            <option key={s.country} value={s.country}>{en ? s.nameEn : s.nameIt}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label>{codeLabel} *</Label>
        <Input
          required
          value={form.fiscalCode}
          onChange={e => set("fiscalCode", e.target.value.toUpperCase())}
          placeholder={spec?.placeholder}
          className="uppercase"
        />
        <p className="text-xs text-[var(--wine-muted)]">
          {en
            ? "The code is verified against your personal details."
            : "Il codice viene verificato con i tuoi dati anagrafici."}
        </p>
      </div>

      <Button
        type="submit"
        disabled={loading || !dirty}
        className="text-white font-semibold"
        style={{ background: "var(--wine-gradient)" }}
      >
        {loading ? (en ? "Saving…" : "Salvataggio…") : (en ? "Save changes" : "Salva modifiche")}
      </Button>
    </form>
  );
}
