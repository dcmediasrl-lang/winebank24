"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, KeyRound, ShieldCheck, ShieldOff, AlertTriangle, Mail, FileText } from "lucide-react";

interface CantinaData {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  website: string | null;
  vatNumber: string | null;
  royaltyPct: number;
  isVerified: boolean;
  contractAcceptedAt: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    isBlocked: boolean;
    emailVerified: string | null;
    createdAt: string;
  };
  _count: { nfts: number; collections: number };
}

export function CantinaEditForm({ cantina }: { cantina: CantinaData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Access fields
  const [email, setEmail] = useState(cantina.user.email);
  const [contactName, setContactName] = useState(cantina.user.name ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Cantina fields
  const [cantinaName, setCantinaName] = useState(cantina.name);
  const [description, setDescription] = useState(cantina.description ?? "");
  const [location, setLocation] = useState(cantina.location ?? "");
  const [website, setWebsite] = useState(cantina.website ?? "");
  const [vatNumber, setVatNumber] = useState(cantina.vatNumber ?? "");
  const [royaltyPct, setRoyaltyPct] = useState(cantina.royaltyPct);
  const [isVerified, setIsVerified] = useState(cantina.isVerified);
  const [isBlocked, setIsBlocked] = useState(cantina.user.isBlocked);

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/cantine/${cantina.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Errore");
  }

  async function saveAll() {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Le password non coincidono");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        email,
        contactName,
        cantinaName,
        description: description || null,
        location: location || null,
        website: website || null,
        vatNumber: vatNumber || null,
        royaltyPct,
        isVerified,
        isBlocked,
      };
      if (newPassword) payload.password = newPassword;
      await patch(payload);
      toast.success("Dati aggiornati con successo");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore");
    } finally {
      setSaving(false);
    }
  }

  async function resendContract() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cantine/${cantina.id}/resend-contract`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      toast.success(`Email contratto inviata a ${data.sentTo}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore");
    } finally {
      setSaving(false);
    }
  }

  async function resendWelcome() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cantine/${cantina.id}/resend-welcome`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      toast.success("Email di accesso inviata a " + email);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBlock() {
    setSaving(true);
    try {
      await patch({ isBlocked: !isBlocked });
      setIsBlocked(v => !v);
      toast.success(isBlocked ? "Account sbloccato" : "Account bloccato");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore");
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, node: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label className="text-white/70 text-xs">{label}</Label>
      {node}
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Status bar */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
        <span className="text-white/50">Stato:</span>
        <Badge variant={isBlocked ? "destructive" : "outline"}>
          {isBlocked ? "Bloccata" : "Attiva"}
        </Badge>
        <Badge variant={isVerified ? "default" : "secondary"}>
          {isVerified ? "Verificata" : "Non verificata"}
        </Badge>
        {cantina.contractAcceptedAt && (
          <Badge className="bg-green-800/60 text-green-300 border-green-700">Contratto accettato</Badge>
        )}
        <span className="ml-auto text-white/40 text-xs">
          {cantina._count.nfts} NFT · {cantina._count.collections} collezioni
        </span>
      </div>

      {/* Access */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Dati di accesso</h2>

        {field("Email di accesso", (
          <Input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            className="bg-white/5 border-white/15"
          />
        ))}

        {field("Nome referente", (
          <Input
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            className="bg-white/5 border-white/15"
          />
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("Nuova password", (
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <Input
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                type="password"
                placeholder="Lascia vuoto per non cambiare"
                className="bg-white/5 border-white/15 pl-8"
              />
            </div>
          ))}
          {field("Conferma password", (
            <Input
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="Ripeti nuova password"
              className="bg-white/5 border-white/15"
            />
          ))}
        </div>
      </section>

      {/* Cantina data */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Dati cantina</h2>

        {field("Nome cantina", (
          <Input
            value={cantinaName}
            onChange={e => setCantinaName(e.target.value)}
            className="bg-white/5 border-white/15"
          />
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("Partita IVA", (
            <Input
              value={vatNumber}
              onChange={e => setVatNumber(e.target.value)}
              className="bg-white/5 border-white/15"
            />
          ))}
          {field("Royalty %", (
            <Input
              value={royaltyPct}
              onChange={e => setRoyaltyPct(parseFloat(e.target.value) || 0)}
              type="number"
              min={0}
              max={50}
              step={0.5}
              className="bg-white/5 border-white/15"
            />
          ))}
        </div>

        {field("Località", (
          <Input
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="bg-white/5 border-white/15"
          />
        ))}

        {field("Sito web", (
          <Input
            value={website}
            onChange={e => setWebsite(e.target.value)}
            type="url"
            placeholder="https://"
            className="bg-white/5 border-white/15"
          />
        ))}

        {field("Descrizione", (
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--wine-red)]"
          />
        ))}
      </section>

      {/* Flags */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">Flags</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isVerified}
            onChange={e => setIsVerified(e.target.checked)}
            className="accent-[var(--wine-red)] w-4 h-4"
          />
          <span className="text-sm text-white/80">Cantina verificata (badge)</span>
        </label>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3 pt-2 border-t border-white/10">
        <Button
          onClick={saveAll}
          disabled={saving}
          className="bg-[var(--wine-red)] hover:bg-[var(--wine-red)]/80 text-white font-semibold"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvataggio..." : "Salva modifiche"}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={toggleBlock}
          className={isBlocked
            ? "border-green-600 text-green-400 hover:bg-green-950/30"
            : "border-red-700 text-red-400 hover:bg-red-950/30"}
        >
          {isBlocked ? (
            <><ShieldCheck className="w-4 h-4 mr-2" />Sblocca account</>
          ) : (
            <><ShieldOff className="w-4 h-4 mr-2" />Blocca account</>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={resendWelcome}
          className="border-blue-700 text-blue-400 hover:bg-blue-950/30"
        >
          <Mail className="w-4 h-4 mr-2" />
          Invia email di accesso
        </Button>

        {cantina.contractAcceptedAt && (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={resendContract}
            className="border-amber-700 text-amber-400 hover:bg-amber-950/30"
          >
            <FileText className="w-4 h-4 mr-2" />
            Reinvia email contratto
          </Button>
        )}
      </div>

      {isBlocked && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/30 border border-red-800/50 text-sm text-red-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          Account bloccato: la cantina non puo accedere ne pubblicare NFT.
        </div>
      )}
    </div>
  );
}
