"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Wine } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "COLLECTOR" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Registrazione completata! Accedi ora.");
      router.push("/login");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore nella registrazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wine className="w-8 h-8 text-amber-400" />
          <span className="text-2xl font-bold text-white">Wine Bank 24</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Crea account</CardTitle>
            <p className="text-center text-sm text-stone-500 mt-1">
              Registrati per acquistare e collezionare NFT di vino
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <Label>Nome completo *</Label>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Mario Rossi" />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="mario@email.com" />
              </div>
              <div className="space-y-1">
                <Label>Password *</Label>
                <Input required type="password" minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="minimo 6 caratteri" />
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
