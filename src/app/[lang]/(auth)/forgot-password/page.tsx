"use client";

import { useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wine, MailCheck } from "lucide-react";

export default function ForgotPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const en = lang === "en";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Messaggio identico in ogni caso: non riveliamo se l'email è registrata
      setSent(true);
      setLoading(false);
    }
  }

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
              {en ? "Forgot your password?" : "Password dimenticata?"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-3 py-2">
                <MailCheck className="w-10 h-10 text-green-500 mx-auto" />
                <p className="text-sm text-white/80">
                  {en
                    ? "If the address is registered, you will receive an email with instructions."
                    : "Se l'indirizzo è registrato, riceverai un'email con le istruzioni."}
                </p>
                <p className="text-xs text-[var(--wine-muted)]">
                  {en ? "The link is valid for one hour." : "Il link è valido per un'ora."}
                </p>
                <Link href={`/${lang}/login`} className="inline-block text-sm text-amber-500 hover:underline pt-2">
                  {en ? "Back to sign in" : "Torna all'accesso"}
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <p className="text-sm text-[var(--wine-muted)]">
                  {en
                    ? "Enter your email address and we'll send you a link to choose a new password."
                    : "Inserisci la tua email: ti invieremo un link per scegliere una nuova password."}
                </p>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nome@email.com"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white font-semibold"
                  style={{ background: "var(--wine-gradient)" }}
                >
                  {loading ? (en ? "Sending…" : "Invio…") : (en ? "Send link" : "Invia il link")}
                </Button>
                <p className="text-center text-sm text-[var(--wine-muted)]">
                  <Link href={`/${lang}/login`} className="text-amber-500 hover:underline">
                    {en ? "Back to sign in" : "Torna all'accesso"}
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
