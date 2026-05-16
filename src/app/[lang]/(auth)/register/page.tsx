"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Wine, Mail } from "lucide-react";

const EU_COUNTRIES_IT = [
  { code: "IT", name: "Italia" }, { code: "DE", name: "Germania" },
  { code: "FR", name: "Francia" }, { code: "ES", name: "Spagna" },
  { code: "NL", name: "Paesi Bassi" }, { code: "BE", name: "Belgio" },
  { code: "AT", name: "Austria" }, { code: "CH", name: "Svizzera" },
  { code: "GB", name: "Regno Unito" }, { code: "US", name: "Stati Uniti" },
  { code: "OTHER", name: "Altro" },
];
const EU_COUNTRIES_EN = [
  { code: "IT", name: "Italy" }, { code: "DE", name: "Germany" },
  { code: "FR", name: "France" }, { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" }, { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" }, { code: "CH", name: "Switzerland" },
  { code: "GB", name: "United Kingdom" }, { code: "US", name: "United States" },
  { code: "OTHER", name: "Other" },
];

export default function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const en = lang === "en";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
    confirmPassword: "", birthDate: "", country: "IT", fiscalCode: "",
  });

  const countries = en ? EU_COUNTRIES_EN : EU_COUNTRIES_IT;

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error(en ? "Passwords do not match" : "Le password non coincidono");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`,
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, password: form.password,
          birthDate: form.birthDate, country: form.country,
          fiscalCode: form.fiscalCode || undefined, role: "COLLECTOR",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRegisteredEmail(form.email);
      setDone(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (en ? "Registration error" : "Errore nella registrazione"));
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
              <h2 className="text-xl font-bold text-stone-900 mb-2">
                {en ? "Check your email" : "Controlla la tua email"}
              </h2>
              <p className="text-stone-500 text-sm mb-4">
                {en ? "We sent a verification link to" : "Abbiamo inviato un link di verifica a"}{" "}
                <strong>{registeredEmail}</strong>.
              </p>
              <p className="text-stone-400 text-xs mb-6">
                {en ? "The link expires within 24 hours." : "Il link scade entro 24 ore."}
              </p>
              <Button variant="outline" className="w-full" onClick={() => router.push(`/${lang}/login`)}>
                {en ? "Go to sign in" : "Vai al login"}
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
            <CardTitle className="text-center">{en ? "Create account" : "Crea account"}</CardTitle>
            <p className="text-center text-sm text-stone-500 mt-1">
              {en ? "Sign up to buy and collect fine wine digital certificates" : "Registrati per acquistare e collezionare certificati digitali di vino"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
                {en ? "Personal details" : "Dati anagrafici"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{en ? "First name" : "Nome"} *</Label>
                  <Input required value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder={en ? "Mario" : "Mario"} />
                </div>
                <div className="space-y-1">
                  <Label>{en ? "Last name" : "Cognome"} *</Label>
                  <Input required value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder={en ? "Rossi" : "Rossi"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{en ? "Date of birth" : "Data di nascita"} *</Label>
                  <Input required type="date" value={form.birthDate} onChange={e => set("birthDate", e.target.value)}
                    max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split("T")[0]} />
                </div>
                <div className="space-y-1">
                  <Label>{en ? "Country" : "Paese"} *</Label>
                  <select required value={form.country} onChange={e => set("country", e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                    {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              {form.country === "IT" && (
                <div className="space-y-1">
                  <Label>{en ? "Italian tax code" : "Codice fiscale"} <span className="text-stone-400">{en ? "(optional)" : "(opzionale)"}</span></Label>
                  <Input value={form.fiscalCode} onChange={e => set("fiscalCode", e.target.value.toUpperCase())} placeholder="RSSMRA80A01H501U" maxLength={16} />
                </div>
              )}
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide pt-2">
                {en ? "Account credentials" : "Dati di accesso"}
              </p>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input required type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="mario@email.com" />
              </div>
              <div className="space-y-1">
                <Label>Password * <span className="text-stone-400 font-normal">{en ? "(min. 8 chars)" : "(min. 8 caratteri)"}</span></Label>
                <Input required type="password" minLength={8} value={form.password} onChange={e => set("password", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{en ? "Confirm password" : "Conferma password"} *</Label>
                <Input required type="password" minLength={8} value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} />
              </div>
              <div className="flex items-start gap-2 pt-1">
                <input required type="checkbox" id="terms" className="mt-1 accent-amber-500" />
                <label htmlFor="terms" className="text-xs text-stone-500 leading-relaxed">
                  {en ? "I have read and agree to the" : "Ho letto e accetto i"}{" "}
                  <Link href={`/${lang}/termini`} target="_blank" className="text-amber-600 hover:underline">{en ? "Terms & Conditions" : "Termini e Condizioni"}</Link>
                  {" "}{en ? "and the" : "e la"}{" "}
                  <Link href={`/${lang}/privacy`} target="_blank" className="text-amber-600 hover:underline">{en ? "Privacy Policy" : "Privacy Policy"}</Link>.{" "}
                  {en ? "I confirm I am purchasing certificates solely for collecting purposes." : "Confermo di acquisire i certificati esclusivamente a fini di collezione."}
                </label>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold mt-2">
                {loading ? (en ? "Creating account..." : "Registrazione...") : (en ? "Create account" : "Crea account")}
              </Button>
            </form>
            <p className="text-center text-sm text-stone-500 mt-4">
              {en ? "Already have an account?" : "Hai già un account?"}{" "}
              <Link href={`/${lang}/login`} className="text-amber-600 hover:underline font-medium">{en ? "Sign in" : "Accedi"}</Link>
            </p>
          </CardContent>
        </Card>
        <div className="text-center mt-4">
          <Link href={lang === "en" ? "/it/register" : "/en/register"} className="text-stone-500 text-xs hover:text-amber-400 transition-colors">
            {lang === "en" ? "🇮🇹 Italiano" : "🇬🇧 English"}
          </Link>
        </div>
      </div>
    </div>
  );
}
