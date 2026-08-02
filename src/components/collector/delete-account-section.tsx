"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertTriangle, Trash2, ShieldCheck } from "lucide-react";

interface Blocker { code: string; message: string }

export function DeleteAccountSection({ lang }: { lang: string }) {
  const en = lang === "en";
  const [open, setOpen] = useState(false);
  const [blockers, setBlockers] = useState<Blocker[] | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/user/delete-account")
      .then(r => r.json())
      .then(d => setBlockers(d.blockers ?? []))
      .catch(() => setBlockers([]));
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(en ? "Account deleted. Goodbye." : "Account cancellato. Arrivederci.");
      setTimeout(() => signOut({ callbackUrl: `/${lang}` }), 1500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (en ? "Error" : "Errore"));
      setLoading(false);
    }
  }

  const canDelete = blockers !== null && blockers.length === 0;

  return (
    <div className="mt-12 pt-8 border-t border-[var(--wine-border)]">
      <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        {en ? "Delete account" : "Cancella account"}
      </h2>
      <p className="text-sm text-[var(--wine-muted)] max-w-xl mb-4 leading-relaxed">
        {en
          ? "You can request the deletion of your personal data at any time (GDPR art. 17). Name, date of birth, tax code, documents and shipping addresses are removed permanently."
          : "Puoi richiedere in qualsiasi momento la cancellazione dei tuoi dati personali (GDPR art. 17). Nome, data di nascita, codice identificativo, documenti e indirizzi di spedizione vengono rimossi definitivamente."}
      </p>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-red-500/40 text-red-400 hover:bg-red-950/30 hover:text-red-300"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {en ? "Request deletion" : "Richiedi la cancellazione"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              {en ? "Delete your account" : "Cancella il tuo account"}
            </DialogTitle>
          </DialogHeader>

          {blockers === null ? (
            <p className="text-sm text-[var(--wine-muted)] py-4">{en ? "Checking…" : "Verifica in corso…"}</p>
          ) : !canDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-white/80">
                {en
                  ? "Before deleting your account you need to close these open positions:"
                  : "Prima di cancellare l'account devi chiudere queste posizioni aperte:"}
              </p>
              <ul className="space-y-2">
                {blockers.map(b => (
                  <li key={b.code} className="text-xs text-amber-300 bg-amber-950/20 border border-amber-700/30 rounded-lg px-3 py-2.5 leading-relaxed">
                    {b.message}
                  </li>
                ))}
              </ul>
              <Button variant="outline" onClick={() => setOpen(false)} className="w-full mt-2">
                {en ? "Close" : "Chiudi"}
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="text-xs text-white/70 bg-[var(--wine-card)] border border-[var(--wine-border)] rounded-lg p-3 space-y-2 leading-relaxed">
                <p className="font-semibold text-white">{en ? "What gets deleted:" : "Cosa viene cancellato:"}</p>
                <p>
                  {en
                    ? "Name, surname, date of birth, tax code, country, documents, shipping addresses, notifications, favourites and wishlist. Access becomes impossible."
                    : "Nome, cognome, data di nascita, codice identificativo, paese, documenti, indirizzi di spedizione, notifiche, preferiti e wishlist. L'accesso diventa impossibile."}
                </p>
                <p className="font-semibold text-white pt-1">{en ? "What we must keep:" : "Cosa siamo obbligati a conservare:"}</p>
                <p>
                  {en
                    ? "Only the accounting data of completed transactions, for ten years, as required by Italian tax law — with no link to your identity."
                    : "I soli dati contabili delle transazioni già concluse, per dieci anni, come impone la normativa fiscale italiana — senza alcun collegamento alla tua identità."}
                </p>
              </div>

              <div className="flex items-start gap-2 text-xs text-red-300 bg-red-950/30 border border-red-700/40 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{en ? "This action cannot be undone." : "L'operazione è irreversibile."}</span>
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  {en ? "Confirm your password" : "Conferma la tua password"}
                </Label>
                <Input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">
                  {en ? 'Type CANCELLA to confirm' : 'Scrivi CANCELLA per confermare'}
                </Label>
                <Input
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value.toUpperCase())}
                  placeholder="CANCELLA"
                  className="font-mono tracking-widest"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  {en ? "Cancel" : "Annulla"}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || confirm !== "CANCELLA"}
                  variant="destructive"
                  className="flex-1"
                >
                  {loading ? (en ? "Deleting…" : "Cancellazione…") : (en ? "Delete forever" : "Cancella per sempre")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
