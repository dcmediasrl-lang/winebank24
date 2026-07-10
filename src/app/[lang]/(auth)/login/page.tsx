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
import { Wine, CheckCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";

function LoginForm({ lang }: { lang: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--wine-bg)" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wine className="w-8 h-8 text-[#e97770]" />
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

        <Card className="border-t-4" style={{ background: "var(--wine-card)", borderColor: "var(--wine-border)", borderTopColor: "#993300", borderTopWidth: "4px" }}>
          <CardHeader>
            <CardTitle className="text-center">{lang === "en" ? "Sign in" : "Accedi"}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Social login buttons */}
            <div className="space-y-2 mb-4">
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center gap-2 bg-white border border-stone-300 text-stone-800 hover:bg-stone-50"
                onClick={() => signIn("google", { callbackUrl: `/${lang}/collector` })}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {lang === "en" ? "Continue with Google" : "Continua con Google"}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-stone-400">
                  {lang === "en" ? "or continue with" : "oppure continua con"}
                </span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.com" />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full text-white font-semibold" style={{ background: "var(--wine-gradient)" }}>
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
          <Link href={lang === "en" ? "/it/login" : "/en/login"} className="text-white/40 text-xs hover:text-white transition-colors">
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
