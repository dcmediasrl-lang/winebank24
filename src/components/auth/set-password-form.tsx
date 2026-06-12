"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wine, KeyRound, CheckCircle, AlertTriangle } from "lucide-react";

export function SetPasswordForm({ token, lang }: { token: string; lang: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-sm text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-white font-semibold">Link non valido</p>
        <p className="text-white/50 text-sm">
          Questo link non e valido. Contatta l&apos;amministratore per ricevere un nuovo link di accesso.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-sm text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
        <p className="text-white text-xl font-bold">Password impostata!</p>
        <p className="text-white/60 text-sm">Ora puoi accedere alla piattaforma con le tue credenziali.</p>
        <Button
          onClick={() => router.push(`/${lang}/login`)}
          className="bg-[var(--wine-red)] hover:bg-[var(--wine-red)]/80 text-white font-semibold w-full"
        >
          Accedi ora
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La password deve essere di almeno 6 caratteri");
      return;
    }
    if (password !== confirm) {
      toast.error("Le password non coincidono");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--wine-red)]/20 border border-[var(--wine-red)]/30 mb-2">
          <Wine className="w-7 h-7 text-[var(--wine-red)]" />
        </div>
        <h1 className="text-2xl font-bold text-white">Imposta la tua password</h1>
        <p className="text-white/50 text-sm">Scegli una password sicura per accedere al tuo account Wine Bank 24.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-white/70 text-sm">Nuova password</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimo 6 caratteri"
              className="pl-10 bg-white/5 border-white/15 text-white"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-white/70 text-sm">Conferma password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Ripeti la password"
            className="bg-white/5 border-white/15 text-white"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--wine-red)] hover:bg-[var(--wine-red)]/80 text-white font-semibold h-11"
        >
          {loading ? "Salvataggio..." : "Imposta password e accedi"}
        </Button>
      </form>
    </div>
  );
}
