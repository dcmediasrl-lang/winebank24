"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Wine, Mail, Eye, EyeOff } from "lucide-react";

export default function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const en = lang === "en";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });

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
        body: JSON.stringify({ email: form.email, password: form.password, role: "COLLECTOR" }),
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--wine-bg)] px-4 py-8">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Wine className="w-8 h-8 text-[#df071b]" />
            <span className="text-2xl font-bold text-white">Wine Bank 24</span>
          </div>
          <Card>
            <CardContent className="pt-8 pb-8">
              <Mail className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">
                {en ? "Check your email" : "Controlla la tua email"}
              </h2>
              <p className="text-[var(--wine-muted)] text-sm mb-4">
                {en ? "We sent a verification link to" : "Abbiamo inviato un link di verifica a"}{" "}
                <strong>{registeredEmail}</strong>.
              </p>
              <p className="text-white/40 text-xs mb-6">
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--wine-bg)] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wine className="w-8 h-8 text-[#df071b]" />
          <span className="text-2xl font-bold text-white">Wine Bank 24</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{en ? "Create account" : "Crea account"}</CardTitle>
            <p className="text-center text-sm text-[var(--wine-muted)] mt-1">
              {en
                ? "Sign up to buy and collect fine wine digital certificates"
                : "Registrati per acquistare e collezionare certificati digitali di vino"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="mario@email.com"
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Password *{" "}
                  <span className="text-white/40 font-normal">
                    {en ? "(min. 8 chars)" : "(min. 8 caratteri)"}
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    required
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    value={form.password}
                    onChange={e => set("password", e.target.value)}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>{en ? "Confirm password" : "Conferma password"} *</Label>
                <div className="relative">
                  <Input
                    required
                    type={showConfirm ? "text" : "password"}
                    minLength={8}
                    value={form.confirmPassword}
                    onChange={e => set("confirmPassword", e.target.value)}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Age confirmation */}
              <div className="flex items-start gap-2 pt-1">
                <input required type="checkbox" id="age" className="mt-1 accent-amber-500" />
                <label htmlFor="age" className="text-xs text-[var(--wine-muted)] leading-relaxed">
                  {en
                    ? "I confirm that I am at least 18 years of age. Wine Bank 24 is reserved for adults only."
                    : "Confermo di avere almeno 18 anni di età. Wine Bank 24 è riservato ai soli maggiorenni."}
                </label>
              </div>

              {/* T&C */}
              <div className="flex items-start gap-2">
                <input required type="checkbox" id="terms" className="mt-1 accent-amber-500" />
                <label htmlFor="terms" className="text-xs text-[var(--wine-muted)] leading-relaxed">
                  {en ? "I have read and agree to the" : "Ho letto e accetto i"}{" "}
                  <Link href={`/${lang}/termini`} target="_blank" className="text-[#df071b] hover:underline">
                    {en ? "Terms & Conditions" : "Termini e Condizioni"}
                  </Link>
                  {" "}{en ? "and the" : "e la"}{" "}
                  <Link href={`/${lang}/privacy`} target="_blank" className="text-[#df071b] hover:underline">
                    Privacy Policy
                  </Link>.{" "}
                  {en
                    ? "I confirm I am purchasing certificates solely for collecting purposes."
                    : "Confermo di acquisire i certificati esclusivamente a fini di collezione."}
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold mt-2" style={{ background: "var(--wine-gradient)" }}
              >
                {loading
                  ? (en ? "Creating account..." : "Registrazione...")
                  : (en ? "Create account" : "Crea account")}
              </Button>
            </form>
            <p className="text-center text-sm text-[var(--wine-muted)] mt-4">
              {en ? "Already have an account?" : "Hai già un account?"}{" "}
              <Link href={`/${lang}/login`} className="text-[#df071b] hover:underline font-medium">
                {en ? "Sign in" : "Accedi"}
              </Link>
            </p>
          </CardContent>
        </Card>
        <div className="text-center mt-4">
          <Link
            href={lang === "en" ? "/it/register" : "/en/register"}
            className="text-[var(--wine-muted)] text-xs hover:text-[#df071b] transition-colors"
          >
            {lang === "en" ? "🇮🇹 Italiano" : "🇬🇧 English"}
          </Link>
        </div>
      </div>
    </div>
  );
}
