"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Wine } from "lucide-react";

export default function CompleteProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const en = lang === "en";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    fiscalCode: "",
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side age check
    const birth = new Date(form.birthDate);
    const age = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (age < 18) {
      toast.error(en ? "You must be at least 18 years old." : "Devi avere almeno 18 anni per utilizzare la piattaforma.");
      return;
    }

    setLoading(true);
    try {
      // Save KYC data
      const kycRes = await fetch("/api/user/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          birthDate: form.birthDate,
          country: "IT",
          fiscalCode: form.fiscalCode,
        }),
      });
      const kycData = await kycRes.json();
      if (!kycRes.ok) throw new Error(kycData.error);

      // Accept terms
      const termsRes = await fetch("/api/collector/accept-terms", { method: "POST" });
      if (!termsRes.ok) throw new Error(en ? "Error accepting terms" : "Errore nell'accettazione dei termini");

      toast.success(en ? "Profile completed!" : "Profilo completato!");
      router.push(`/${lang}/collector`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (en ? "Error saving data" : "Errore nel salvataggio"));
    } finally {
      setLoading(false);
    }
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
            <CardTitle className="text-center">
              {en ? "Complete your profile" : "Completa il tuo profilo"}
            </CardTitle>
            <p className="text-center text-sm text-[var(--wine-muted)] mt-1">
              {en
                ? "We need a few details to verify your identity and confirm you are of legal age."
                : "Abbiamo bisogno di alcuni dati per verificare la tua identità e confermare la maggiore età."}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{en ? "First name" : "Nome"} *</Label>
                  <Input
                    required
                    value={form.firstName}
                    onChange={e => set("firstName", e.target.value)}
                    placeholder={en ? "Mario" : "Mario"}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{en ? "Last name" : "Cognome"} *</Label>
                  <Input
                    required
                    value={form.lastName}
                    onChange={e => set("lastName", e.target.value)}
                    placeholder={en ? "Rossi" : "Rossi"}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>{en ? "Date of birth" : "Data di nascita"} *</Label>
                <Input
                  required
                  type="date"
                  max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                  value={form.birthDate}
                  onChange={e => set("birthDate", e.target.value)}
                />
                <p className="text-xs text-[var(--wine-muted)]">
                  {en ? "You must be at least 18 years old." : "Devi avere almeno 18 anni di età."}
                </p>
              </div>

              <div className="space-y-1">
                <Label>{en ? "Fiscal code" : "Codice fiscale"} *</Label>
                <Input
                  required
                  value={form.fiscalCode}
                  onChange={e => set("fiscalCode", e.target.value.toUpperCase())}
                  placeholder="RSSMRA80A01H501Z"
                  className="uppercase"
                />
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
                className="w-full text-white font-semibold mt-2"
                style={{ background: "var(--wine-gradient)" }}
              >
                {loading
                  ? (en ? "Saving..." : "Salvataggio...")
                  : (en ? "Complete registration" : "Completa la registrazione")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
