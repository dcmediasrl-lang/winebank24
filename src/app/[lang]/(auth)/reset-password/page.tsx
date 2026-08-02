"use client";

import { useState, use, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Wine, Eye, EyeOff, CheckCircle } from "lucide-react";

function ResetForm({ lang }: { lang: string }) {
  const en = lang === "en";
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(en ? "Passwords do not match" : "Le password non coincidono");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      setTimeout(() => router.push(`/${lang}/login`), 2500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (en ? "Error" : "Errore"));
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-3 py-2">
        <p className="text-sm text-white/80">
          {en ? "Invalid link." : "Link non valido."}
        </p>
        <Link href={`/${lang}/forgot-password`} className="inline-block text-sm text-amber-500 hover:underline">
          {en ? "Request a new link" : "Richiedi un nuovo link"}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-3 py-2">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
        <p className="text-sm text-white/80">
          {en ? "Password updated. Redirecting to sign in…" : "Password aggiornata. Ti riportiamo all'accesso…"}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <Label>{en ? "New password" : "Nuova password"} *</Label>
        <div className="relative">
          <Input
            required
            minLength={8}
            type={show ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-[var(--wine-muted)]">
          {en ? "At least 8 characters." : "Almeno 8 caratteri."}
        </p>
      </div>

      <div className="space-y-1">
        <Label>{en ? "Confirm password" : "Conferma password"} *</Label>
        <Input
          required
          minLength={8}
          type={show ? "text" : "password"}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full text-white font-semibold"
        style={{ background: "var(--wine-gradient)" }}
      >
        {loading ? (en ? "Saving…" : "Salvataggio…") : (en ? "Set new password" : "Imposta la nuova password")}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const en = lang === "en";
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--wine-bg)] px-4 py-8">
      <div className="w-full max-w-sm">
        <Link href={`/${lang}`} className="flex items-center justify-center gap-2 mb-8 hover:opacity-80 transition-opacity">
          <Wine className="w-8 h-8 text-[#df071b]" />
          <span className="text-2xl font-bold text-white">Wine Bank 24</span>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {en ? "Choose a new password" : "Scegli una nuova password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-sm text-[var(--wine-muted)] text-center">…</p>}>
              <ResetForm lang={lang} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
