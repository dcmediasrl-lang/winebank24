"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Smartphone, CheckCircle, XCircle, Key } from "lucide-react";
import Image from "next/image";

type User = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  birthDate: Date | null;
  country: string | null;
  fiscalCode: string | null;
  kycVerifiedAt: Date | null;
  emailVerified: Date | null;
  twoFactorEnabled: boolean;
};

export function SecuritySettings({ user }: { user: User }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <EmailVerificationCard user={user} />
      <KycCard user={user} />
      <TwoFactorCard user={user} />
    </div>
  );
}

function EmailVerificationCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Verifica email
        </CardTitle>
      </CardHeader>
      <CardContent>
        {user.emailVerified ? (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Email verificata il {new Date(user.emailVerified).toLocaleDateString("it-IT")}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <XCircle className="w-4 h-4 shrink-0" />
            Email non ancora verificata. Controlla la tua casella di posta.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KycCard({ user }: { user: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Dati anagrafici (KYC)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {user.kycVerifiedAt && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Identità verificata il {new Date(user.kycVerifiedAt).toLocaleDateString("it-IT")}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-stone-500">Nome</span>
            <p className="font-medium text-stone-900">{user.firstName || "—"}</p>
          </div>
          <div>
            <span className="text-stone-500">Cognome</span>
            <p className="font-medium text-stone-900">{user.lastName || "—"}</p>
          </div>
          <div>
            <span className="text-stone-500">Data di nascita</span>
            <p className="font-medium text-stone-900">
              {user.birthDate ? new Date(user.birthDate).toLocaleDateString("it-IT") : "—"}
            </p>
          </div>
          <div>
            <span className="text-stone-500">Paese</span>
            <p className="font-medium text-stone-900">{user.country || "—"}</p>
          </div>
          {user.fiscalCode && (
            <div>
              <span className="text-stone-500">Codice fiscale</span>
              <p className="font-medium text-stone-900">{user.fiscalCode}</p>
            </div>
          )}
        </div>
        <p className="text-xs text-stone-400 mt-2">
          Per modificare i tuoi dati anagrafici contatta il supporto: <a href="mailto:privacy@winebank24.com" className="text-amber-600 hover:underline">privacy@winebank24.com</a>
        </p>
      </CardContent>
    </Card>
  );
}

function TwoFactorCard({ user }: { user: User }) {
  const [enabled, setEnabled] = useState(user.twoFactorEnabled);
  const [step, setStep] = useState<"idle" | "setup" | "confirm">("idle");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("setup");
    } catch {
      toast.error("Errore durante la configurazione");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEnabled(true);
      setStep("idle");
      setOtp("");
      toast.success("Autenticazione a due fattori attivata!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Codice non valido");
    } finally {
      setLoading(false);
    }
  }

  async function disable2FA() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", { method: "POST" });
      if (!res.ok) throw new Error();
      setEnabled(false);
      toast.success("2FA disattivato");
    } catch {
      toast.error("Errore durante la disattivazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-purple-500" />
          Autenticazione a due fattori (2FA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled && step === "idle" && (
          <>
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <CheckCircle className="w-4 h-4 shrink-0" />
              2FA attivo — il tuo account è protetto da autenticazione a due fattori
            </div>
            <Button variant="outline" size="sm" onClick={disable2FA} disabled={loading} className="text-red-600 border-red-200 hover:bg-red-50">
              Disattiva 2FA
            </Button>
          </>
        )}

        {!enabled && step === "idle" && (
          <>
            <p className="text-sm text-stone-500">
              Aggiungi un secondo livello di sicurezza al tuo account. Usa un&apos;app come Google Authenticator o Authy.
            </p>
            <Button size="sm" onClick={startSetup} disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold">
              <Key className="w-4 h-4 mr-2" />
              Attiva 2FA
            </Button>
          </>
        )}

        {step === "setup" && qrCode && (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              1. Apri Google Authenticator o Authy e scansiona il QR code:
            </p>
            <div className="flex justify-center">
              <Image src={qrCode} alt="QR Code 2FA" width={160} height={160} className="rounded-lg border border-stone-200" />
            </div>
            <p className="text-xs text-stone-500 text-center">
              Oppure inserisci manualmente il codice: <code className="bg-stone-100 px-1 rounded">{secret}</code>
            </p>
            <p className="text-sm text-stone-600">2. Inserisci il codice a 6 cifre generato dall&apos;app:</p>
            <div className="space-y-2">
              <Label>Codice OTP</Label>
              <Input
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={confirmSetup} disabled={loading || otp.length !== 6} className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold">
                Conferma e attiva
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setStep("idle"); setOtp(""); }}>
                Annulla
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
