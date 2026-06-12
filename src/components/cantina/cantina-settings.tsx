"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Save, ShieldCheck, ExternalLink, Upload, FileText,
  Trash2, UserCircle, CreditCard, Building2, CheckCircle2,
  AlertCircle, Link2, Unlink, RefreshCw, Download,
} from "lucide-react";
import Image from "next/image";

type Cantina = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  website: string | null;
  logoUrl: string | null;
  vatNumber: string | null;
  isVerified: boolean;
  royaltyPct: number;
  contractAcceptedAt: Date | null;
  stripeAccountId: string | null;
  insuranceDocUrl: string | null;
  insuranceUploadedAt: Date | null;
  iban: string | null;
  bic: string | null;
  bankName: string | null;
};

const TABS = [
  { key: "profilo",    label: "Profilo",    icon: UserCircle },
  { key: "documenti",  label: "Documenti",  icon: ShieldCheck },
  { key: "pagamenti",  label: "Pagamenti",  icon: CreditCard },
] as const;
type TabKey = typeof TABS[number]["key"];

const SECTION = "bg-[#1a0f0f] rounded-xl border border-white/10 p-5 space-y-4";
const TEXTAREA = "w-full px-3 py-2.5 rounded-lg border border-white/20 bg-black/30 text-white placeholder:text-white/30 text-sm resize-none focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";

// ─── Profilo tab ────────────────────────────────────────────────────────────

function ProfiloTab({ cantina, lang }: { cantina: Cantina; lang: string }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: cantina.name,
    description: cantina.description ?? "",
    location: cantina.location ?? "",
    website: cantina.website ?? "",
    logoUrl: cantina.logoUrl ?? "",
  });
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/cantina/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Profilo aggiornato");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {/* Verification status */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1a0f0f] border border-[var(--wine-border)]">
        <ShieldCheck className={`w-5 h-5 shrink-0 ${cantina.isVerified ? "text-green-400" : "text-white/30"}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-white">
            {cantina.isVerified ? "Cantina verificata" : "In attesa di verifica"}
          </p>
          <p className="text-xs text-white/40">
            {cantina.isVerified
              ? "Il badge di verifica appare sul tuo profilo pubblico"
              : "Contatta l'amministratore per far verificare la cantina"}
          </p>
        </div>
        <Badge className={cantina.isVerified
          ? "bg-green-900/40 text-green-400 border-green-700/40"
          : "bg-white/5 text-white/40 border-white/10"}>
          {cantina.isVerified ? "Verificata" : "Non verificata"}
        </Badge>
      </div>

      {/* Dati principali */}
      <div className={SECTION}>
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Dati principali</p>
        <div className="space-y-1.5">
          <Label>Nome cantina *</Label>
          <Input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Nome della tua cantina" />
        </div>
        <div className="space-y-1.5">
          <Label>Descrizione <span className="text-white/30 font-normal">(visibile sul profilo pubblico)</span></Label>
          <textarea
            value={form.description}
            onChange={e => set("description", e.target.value)}
            placeholder="Racconta la storia della tua cantina, la filosofia produttiva, il territorio…"
            rows={5}
            maxLength={2000}
            className={TEXTAREA}
          />
          <p className="text-xs text-white/30">{form.description.length}/2000 caratteri</p>
        </div>
        <div className="space-y-1.5">
          <Label>Localizzazione <span className="text-white/30 font-normal">(es. Barolo, Piemonte)</span></Label>
          <Input value={form.location} onChange={e => set("location", e.target.value)} placeholder="Comune, Regione" />
        </div>
        <div className="space-y-1.5">
          <Label>Sito web</Label>
          <Input type="url" value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://www.tuacantina.it" />
          {form.website && (
            <a href={form.website} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-500 hover:underline flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> Apri sito
            </a>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className={SECTION}>
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Logo</p>
        <div className="flex items-start gap-4">
          {form.logoUrl ? (
            <Image src={form.logoUrl} alt="Logo" width={80} height={80}
              className="w-20 h-20 rounded-xl object-contain bg-[#1a0f0f] border border-white/10 shrink-0"
              onError={() => set("logoUrl", "")} />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-[#1a0f0f] border border-white/10 flex items-center justify-center shrink-0 text-2xl">🍷</div>
          )}
          <div className="flex-1 space-y-1.5">
            <Label>URL immagine logo</Label>
            <Input type="url" value={form.logoUrl} onChange={e => set("logoUrl", e.target.value)} placeholder="https://..." />
            <p className="text-xs text-white/30">Incolla il link diretto all&apos;immagine (PNG, JPG, SVG)</p>
          </div>
        </div>
      </div>

      {/* Read-only fiscal */}
      <div className={SECTION}>
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wide">Dati fiscali e commissioni</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/40 text-xs mb-1">Partita IVA</p>
            <p className="text-white font-mono">{cantina.vatNumber ?? "—"}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Royalty NFT</p>
            <p className="text-white font-mono">{cantina.royaltyPct}%</p>
          </div>
        </div>
        <p className="text-xs text-white/25">Per modificare P.IVA e royalty contatta l&apos;amministratore</p>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-3">
        <Save className="w-4 h-4 mr-2" />
        {loading ? "Salvataggio…" : "Salva profilo"}
      </Button>
    </form>
  );
}

// ─── Documenti tab ───────────────────────────────────────────────────────────

function DocumentiTab({ cantina }: { cantina: Cantina }) {
  const hasContract = !!cantina.contractAcceptedAt;
  const [docUrl, setDocUrl] = useState(cantina.insuranceDocUrl);
  const [uploadedDate, setUploadedDate] = useState(cantina.insuranceUploadedAt);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/cantina/insurance", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDocUrl(data.url);
      setUploadedDate(new Date());
      toast.success("Polizza caricata");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore nel caricamento");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemove() {
    setRemoving(true);
    try {
      const res = await fetch("/api/cantina/insurance", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setDocUrl(null);
      setUploadedDate(null);
      toast.success("Polizza rimossa");
    } catch {
      toast.error("Errore nella rimozione");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Stato */}
      <div className={SECTION}>
        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Stato conformità</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <FileText className="w-4 h-4" /> Contratto Creator
            </div>
            <div className="flex items-center gap-2">
              <Badge className={hasContract
                ? "bg-green-900/40 text-green-400 border-green-700/40"
                : "bg-red-900/40 text-red-400 border-red-700/40"}>
                {hasContract ? "Accettato" : "Non accettato"}
              </Badge>
              {hasContract && (
                <a
                  href="/api/cantina/contract-pdf"
                  download
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-amber-700/40 text-amber-400 hover:bg-amber-900/20 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Scarica PDF
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <ShieldCheck className="w-4 h-4" /> Polizza assicurativa
            </div>
            <Badge className={docUrl
              ? "bg-green-900/40 text-green-400 border-green-700/40"
              : "bg-amber-900/30 text-amber-400 border-amber-700/30"}>
              {docUrl ? "Caricata" : "Da caricare"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Info obbligo */}
      <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 p-4 text-sm space-y-2">
        <div className="flex items-center gap-2 font-semibold text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Obbligo contrattuale — art. A.3
        </div>
        <p className="text-white/60 leading-relaxed">
          Il Contratto Creator richiede una <strong className="text-white/80">polizza All Risks</strong> per il valore totale
          dei beni certificati, con Wine Bank 24 e i titolari di certificati come beneficiari in caso di sinistro.
          Presentazione entro <strong className="text-white/80">30 giorni</strong> dall&apos;accettazione del contratto,
          con rinnovo annuale.
        </p>
      </div>

      {/* Upload */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" /> Documento polizza
          </h3>
          {docUrl ? (
            <div className="bg-[#2a1010] rounded-xl border border-white/15 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{docUrl.split("/").pop() ?? "polizza.pdf"}</p>
                  {uploadedDate && (
                    <p className="text-xs text-white/40">
                      Caricata il {new Date(uploadedDate).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <a href={docUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/15 text-sm text-white/70 hover:text-white hover:border-white/30 transition-colors">
                  <ExternalLink className="w-4 h-4" /> Visualizza
                </a>
                <Button variant="ghost" size="sm" onClick={handleRemove} disabled={removing}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-900/30">
                  <Trash2 className="w-4 h-4 mr-1" />
                  {removing ? "Rimozione…" : "Rimuovi"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="border-amber-700/40 text-amber-400 hover:bg-amber-900/20">
                  <Upload className="w-4 h-4 mr-1" />
                  Aggiorna
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/40 hover:bg-amber-900/5 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-white/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-white/70 mb-1">Clicca per caricare la polizza</p>
              <p className="text-xs text-white/40">PDF, JPG o PNG · max 20 MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUpload} disabled={uploading} />
          {uploading && <p className="text-sm text-amber-400 text-center animate-pulse">Caricamento in corso…</p>}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Pagamenti tab ───────────────────────────────────────────────────────────

function PagamentiTab({ cantina, lang }: { cantina: Cantina; lang: string }) {
  const searchParams = useSearchParams();
  const stripeResult = searchParams.get("stripe");

  const [stripeAccountId, setStripeAccountId] = useState(cantina.stripeAccountId);
  const [connectLoading, setConnectLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bank, setBank] = useState({
    iban: cantina.iban ?? "",
    bic: cantina.bic ?? "",
    bankName: cantina.bankName ?? "",
  });
  const setB = (f: string, v: string) => setBank(p => ({ ...p, [f]: v }));

  useEffect(() => {
    if (stripeResult === "success") toast.success("Account Stripe collegato con successo!");
    if (stripeResult === "refresh")  toast.error("Onboarding Stripe non completato. Riprova.");
  }, [stripeResult]);

  async function connectStripe() {
    setConnectLoading(true);
    try {
      const res = await fetch("/api/cantina/stripe-connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore Stripe Connect");
      setConnectLoading(false);
    }
  }

  async function disconnectStripe() {
    if (!confirm("Disconnettere l'account Stripe? I pagamenti automatici verranno disabilitati.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/cantina/stripe-connect", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setStripeAccountId(null);
      toast.success("Account Stripe disconnesso");
    } catch {
      toast.error("Errore durante la disconnessione");
    } finally {
      setDisconnecting(false);
    }
  }

  async function saveBank(e: React.FormEvent) {
    e.preventDefault();
    setSavingBank(true);
    try {
      const res = await fetch("/api/cantina/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bank),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Coordinate bancarie salvate");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Errore durante il salvataggio");
    } finally {
      setSavingBank(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="rounded-xl border border-white/10 bg-[#1a0f0f] p-4 text-sm text-white/60 leading-relaxed">
        Scegli come ricevere i pagamenti per le vendite degli NFT. Puoi configurare <strong className="text-white/80">Stripe Connect</strong> per
        accrediti automatici sul tuo conto, oppure indicare le tue <strong className="text-white/80">coordinate bancarie</strong> per i
        bonifici manuali da parte del team Wine Bank 24.
      </div>

      {/* ── Stripe Connect ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-4 h-4 fill-[#635bff]">
              <path d="M16 0C7.163 0 0 7.163 0 16s7.163 16 16 16 16-7.163 16-16S24.837 0 16 0zm6.4 18.56c0 2.624-2.08 3.84-4.8 3.84-2.08 0-3.84-.64-5.44-1.76v-3.2c1.44 1.12 3.2 1.92 5.12 1.92.96 0 1.6-.32 1.6-1.12 0-2.08-7.04-1.44-7.04-5.92 0-2.56 2.08-3.84 4.64-3.84 1.92 0 3.52.48 4.96 1.44v3.04c-1.28-.96-2.88-1.6-4.64-1.6-.8 0-1.44.32-1.44 1.12 0 2.08 6.72 1.28 7.04 6.12z"/>
            </svg>
          </div>
          <h3 className="font-semibold text-white">Stripe Connect</h3>
          <span className="text-xs text-white/40">— pagamenti automatici</span>
        </div>

        <div className={SECTION}>
          {stripeAccountId ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-400">Account connesso</p>
                  <p className="text-xs text-white/40 font-mono truncate">{stripeAccountId}</p>
                </div>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                Le quote di vendita vengono accreditate automaticamente sul tuo conto bancario dopo ogni transazione completata, al netto della commissione di piattaforma.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={connectStripe} disabled={connectLoading}
                  className="border-white/20 text-white/60 hover:text-white gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Aggiorna dati
                </Button>
                <Button variant="ghost" size="sm" onClick={disconnectStripe} disabled={disconnecting}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-900/30 gap-1.5">
                  <Unlink className="w-3.5 h-3.5" />
                  {disconnecting ? "Disconnessione…" : "Disconnetti"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-white/60 leading-relaxed">
                Collega il tuo account Stripe per ricevere i pagamenti in automatico. Verrai guidato attraverso il processo di verifica di Stripe in pochi minuti.
              </p>
              <Button onClick={connectStripe} disabled={connectLoading}
                className="bg-[#635bff] hover:bg-[#5147e5] text-white font-semibold gap-2 w-full sm:w-auto">
                <Link2 className="w-4 h-4" />
                {connectLoading ? "Reindirizzamento a Stripe…" : "Collega account Stripe"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bonifico bancario ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-white">Coordinate bancarie</h3>
          <span className="text-xs text-white/40">— bonifico manuale</span>
        </div>

        <form onSubmit={saveBank} className={`${SECTION} !space-y-4`}>
          <p className="text-xs text-white/50 leading-relaxed">
            Alternativa a Stripe Connect. Il team Wine Bank 24 effettuerà il bonifico verso il conto indicato entro 5 giorni lavorativi dalla transazione.
          </p>

          <div className="space-y-1.5">
            <Label>IBAN</Label>
            <Input
              value={bank.iban}
              onChange={e => setB("iban", e.target.value.toUpperCase().replace(/\s/g, ""))}
              placeholder="IT60X0542811101000000123456"
              maxLength={34}
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>BIC / SWIFT</Label>
              <Input
                value={bank.bic}
                onChange={e => setB("bic", e.target.value.toUpperCase().replace(/\s/g, ""))}
                placeholder="BCITITMM"
                maxLength={11}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nome banca</Label>
              <Input
                value={bank.bankName}
                onChange={e => setB("bankName", e.target.value)}
                placeholder="Intesa Sanpaolo"
              />
            </div>
          </div>

          {(bank.iban || bank.bic || bank.bankName) && (
            <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-xs text-white/50 space-y-1 font-mono">
              {bank.bankName && <p><span className="text-white/30">Banca:</span> {bank.bankName}</p>}
              {bank.iban && <p><span className="text-white/30">IBAN:</span>  {bank.iban.match(/.{1,4}/g)?.join(" ")}</p>}
              {bank.bic  && <p><span className="text-white/30">BIC:</span>   {bank.bic}</p>}
            </div>
          )}

          <Button type="submit" disabled={savingBank} className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold gap-2">
            <Save className="w-4 h-4" />
            {savingBank ? "Salvataggio…" : "Salva coordinate"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Root component ──────────────────────────────────────────────────────────

export function CantinaSettings({ cantina, lang }: { cantina: Cantina; lang: string }) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey | null) ?? "profilo";
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.some(t => t.key === initialTab) ? initialTab : "profilo"
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Impostazioni cantina</h1>
        <p className="text-[var(--wine-muted)] text-sm mt-1">
          Gestisci profilo pubblico, documenti obbligatori e metodi di pagamento
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 bg-[#1a0f0f] p-1 rounded-xl border border-[var(--wine-border)]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-[#993300] text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "profilo"   && <ProfiloTab   cantina={cantina} lang={lang} />}
      {activeTab === "documenti" && <DocumentiTab cantina={cantina} />}
      {activeTab === "pagamenti" && <PagamentiTab cantina={cantina} lang={lang} />}
    </div>
  );
}
