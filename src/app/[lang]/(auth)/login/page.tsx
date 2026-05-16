"use client";

import { useState, Suspense, use } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Wine, CheckCircle, AlertTriangle } from "lucide-react";

function LoginForm({ lang }: { lang: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isVerified = searchParams.get("verified") === "1";
  const errorType = searchParams.get("error");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      toast.error(lang === "en"
        ? "Incorrect email or password, or account temporarily locked."
        : "Email o password non corretti, oppure account bloccato temporaneamente.");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    const role = session?.user?.role;
    if (role === "ADMIN") router.push(`/${lang}/admin`);
    else if (role === "CANTINA") router.push(`/${lang}/cantina`);
    else router.push(`/${lang}/collector/portfolio`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wine className="w-8 h-8 text-amber-400" />
          <span className="text-2xl font-bold text-white">Wine Bank 24</span>
        </div>

        {isVerified && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
            <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-sm text-green-700">
              {lang === "en" ? "Email verified! Sign in to your account." : "Email verificata! Accedi al tuo account."}
            </p>
          </div>
        )}

        {errorType && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700">
              {errorType === "token_invalid"
                ? (lang === "en" ? "Invalid or expired verification link." : "Link di verifica non valido o scaduto.")
                : (lang === "en" ? "An error occurred. Please try again." : "Si è verificato un errore. Riprova.")}
            </p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-center">{lang === "en" ? "Sign in" : "Accedi"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.com" />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold">
                {loading
                  ? (lang === "en" ? "Signing in..." : "Accesso in corso...")
                  : (lang === "en" ? "Sign in" : "Accedi")}
              </Button>
            </form>
            <p className="text-center text-sm text-stone-500 mt-4">
              {lang === "en" ? "Don't have an account?" : "Non hai un account?"}{" "}
              <Link href={`/${lang}/register`} className="text-amber-600 hover:underline font-medium">
                {lang === "en" ? "Sign up" : "Registrati"}
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Language switcher */}
        <div className="text-center mt-4">
          <Link href={lang === "en" ? "/it/login" : "/en/login"} className="text-stone-500 text-xs hover:text-amber-400 transition-colors">
            {lang === "en" ? "🇮🇹 Italiano" : "🇬🇧 English"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  return (
    <Suspense>
      <LoginForm lang={lang} />
    </Suspense>
  );
}
