"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Wine, Mail } from "lucide-react";

const EU_COUNTRIES = [
  { code: "IT", name: "Italia" },
  { code: "DE", name: "Germania" },
  { code: "FR", name: "Francia" },
  { code: "ES", name: "Spagna" },
  { code: "NL", name: "Paesi Bassi" },
  { code: "BE", name: "Belgio" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Svizzera" },
  { code: "GB", name: "Regno Unito" },
  { code: "US", name: "Stati Uniti" },
  { code: "OTHER", name: "Altro" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    country: "IT",
    fiscalCode: "",
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Le password non coincidono");
      return;
    }
    if (form.password.length < 8) {
      toast.error("La password deve essere di almeno 8 caratteri");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          birthDate: form.birthDate,
          country: form.country,
          fiscalCode: form.fiscalCode || undefined,
          role: "COLLECTOR",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore nella registrazione");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 px-4 py-8">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Wine className="w-8 h-8 text-amber-400" />
            <span className="text-2xl font-bold text-white">Wine Bank 24</span>
          </div>
          <Card>
            <CardContent className="pt-8 pb-8">
              <Mail className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-stone-900 mb-2">Controlla la tua email</h2>
              <p className="text-stone-500 text-sm mb-4">
                Abbiamo inviato un link di verifica a <strong>{form.email}</strong>.
                Clicca il link per attivare il tuo account.
              </p>
              <p className="text-stone-400 text-xs mb-6">Il link scade entro 24 ore.</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/login")}
              >
                Vai al login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wine className="w-8 h-8 text-amber-400" />
          <span className="text-2xl font-bold text-white">Wine Bank 24</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Crea account</CardTitle>
            <p className="text-center text-sm text-stone-500 mt-1">
              Registrati per acquistare e collezionare certificati digitali di vino
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">

              {/* Dati anagrafici */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Dati anagrafici</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Nome *</Label>
                  <Input required value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Mario" />
                </div>
                <div className="space-y-1">
                  <Label>Cognome *</Label>
                  <Input required value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Rossi" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Data di nascita *</Label>
                  <Input required type="date" value={form.birthDate} onChange={e => set("birthDate", e.target.value)} max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split("T")[0]} />
                </div>
                <div className="space-y-1">
                  <Label>Paese di residenza *</Label>
                  <select
                    required
                    value={form.country}
                    onChange={e => set("country", e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {EU_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {form.country === "IT" && (
                <div className="space-y-1">
                  <Label>Codice fiscale <span className="text-stone-400">(opzionale)</span></Label>
                  <Input
                    value={form.fiscalCode}
                    onChange={e => set("fiscalCode", e.target.value.toUpperCase())}
                    placeholder="RSSMRA80A01H501U"
                    maxLength={16}
                  />
                </div>
              )}

              {/* Dati accesso */}
              <div className="space-y-1 pt-2">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Dati di accesso</p>
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input required type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="mario@email.com" />
              </div>
              <div className="space-y-1">
                <Label>Password * <span className="text-stone-400 font-normal">(min. 8 caratteri)</span></Label>
                <Input required type="password" minLength={8} value={form.password} onChange={e => set("password", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Conferma password *</Label>
                <Input required type="password" minLength={8} value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} />
              </div>

              {/* Consenso */}
              <div className="flex items-start gap-2 pt-1">
                <input required type="checkbox" id="terms" className="mt-1 accent-amber-500" />
                <label htmlFor="terms" className="text-xs text-stone-500 leading-relaxed">
                  Ho letto e accetto i{" "}
                  <Link href="/termini" target="_blank" className="text-amber-600 hover:underline">Termini e Condizioni</Link>
                  {" "}e la{" "}
                  <Link href="/privacy" target="_blank" className="text-amber-600 hover:underline">Privacy Policy</Link>.
                  Confermo di acquisire i certificati esclusivamente a fini di collezione.
                </label>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold mt-2">
                {loading ? "Registrazione..." : "Crea account"}
              </Button>
            </form>
            <p className="text-center text-sm text-stone-500 mt-4">
              Hai già un account?{" "}
              <Link href="/login" className="text-amber-600 hover:underline font-medium">Accedi</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
