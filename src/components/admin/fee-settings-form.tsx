"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Info } from "lucide-react";

export function FeeSettingsForm({ configId, platformFeePct, mintFeePct }: {
  configId: string;
  platformFeePct: number;
  mintFeePct: number;
}) {
  const [platform, setPlatform] = useState(platformFeePct.toString());
  const [mint, setMint] = useState(mintFeePct.toString());
  const [loading, setLoading] = useState(false);

  const pf = parseFloat(platform) || 0;
  const mf = parseFloat(mint) || 0;

  async function save() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId, platformFeePct: pf, mintFeePct: mf }),
      });
      if (!res.ok) throw new Error();
      toast.success("Configurazione salvata");
    } catch {
      toast.error("Errore nel salvataggio");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Policy box */}
      <div className="flex gap-3 p-4 rounded-xl border border-amber-700/40 bg-amber-950/20 text-sm text-amber-300">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold">Struttura commissioni</p>
          <ul className="text-amber-300/70 text-xs leading-relaxed space-y-1 list-disc list-inside">
            <li><strong className="text-amber-300">Fee di emissione</strong>: pagata dalla cantina al momento del mint (% sul valore bottiglia). Fissa per tutta la piattaforma.</li>
            <li><strong className="text-amber-300">Fee di scambio</strong>: a carico dell&apos;acquirente, aggiunta al prezzo. Valida su ogni transazione primaria e secondaria.</li>
            <li><strong className="text-amber-300">Royalty cantina</strong>: definita dalla cantina per ogni singola bottiglia (1–10%), a carico acquirente solo su scambi secondari.</li>
          </ul>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commissioni di piattaforma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Mint fee */}
          <div className="space-y-1.5">
            <Label>Fee di emissione — a carico cantina (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={mint}
              onChange={e => setMint(e.target.value)}
            />
            <p className="text-xs text-white/40">
              Calcolata sul prezzo della bottiglia al momento del mint. La cantina la paga via Stripe prima che il certificato venga attivato.
            </p>
          </div>

          {/* Platform trading fee */}
          <div className="space-y-1.5">
            <Label>Fee di scambio — a carico acquirente (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
            />
            <p className="text-xs text-white/40">
              Aggiunta al prezzo in ogni acquisto (primario e secondario). Appare come voce separata nel checkout Stripe.
            </p>
          </div>

          {/* Live preview */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm space-y-4">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Esempio con bottiglia da € 100,00</p>

            <div className="space-y-2">
              <div className="font-semibold text-white/70 text-xs">Emissione certificato (cantina paga)</div>
              <div className="flex justify-between text-xs"><span className="text-white/50">Valore bottiglia</span><span>€ 100,00</span></div>
              <div className="flex justify-between text-xs text-red-400"><span>Fee di emissione ({mf}%)</span><span>- € {mf.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs font-bold border-t border-white/10 pt-2"><span>Netto cantina dal mint</span><span>€ {(100 - mf).toFixed(2)}</span></div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="font-semibold text-white/70 text-xs">Vendita primaria (cantina → acquirente)</div>
              <div className="flex justify-between text-xs"><span className="text-white/50">Prezzo certificato</span><span>€ 100,00</span></div>
              <div className="flex justify-between text-xs text-amber-400"><span>+ Fee di scambio ({pf}%)</span><span>€ {pf.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs font-bold border-t border-white/10 pt-2"><span>Totale a carico acquirente</span><span>€ {(100 + pf).toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-green-400"><span>Cantina riceve</span><span>€ 100,00</span></div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="font-semibold text-white/70 text-xs">Vendita secondaria (collezionista → acquirente) — esempio royalty 5%</div>
              <div className="flex justify-between text-xs"><span className="text-white/50">Prezzo certificato</span><span>€ 100,00</span></div>
              <div className="flex justify-between text-xs text-amber-400"><span>+ Fee di scambio ({pf}%)</span><span>€ {pf.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-amber-400"><span>+ Royalty cantina (5%)</span><span>€ 5,00</span></div>
              <div className="flex justify-between text-xs font-bold border-t border-white/10 pt-2"><span>Totale a carico acquirente</span><span>€ {(100 + pf + 5).toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-green-400"><span>Venditore riceve</span><span>€ 100,00</span></div>
            </div>
          </div>

          <Button onClick={save} disabled={loading} className="w-full" style={{ background: "var(--wine-gradient)" }}>
            {loading ? "Salvataggio..." : "Salva configurazione"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
