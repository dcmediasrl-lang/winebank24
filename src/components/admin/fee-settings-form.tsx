"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Info } from "lucide-react";

export function FeeSettingsForm({ configId, platformFeePct, cantinaFeePct }: {
  configId: string;
  platformFeePct: number;
  cantinaFeePct: number;
}) {
  const [platform, setPlatform] = useState(platformFeePct.toString());
  const [cantina, setCantina] = useState(cantinaFeePct.toString());
  const [loading, setLoading] = useState(false);

  const pf = parseFloat(platform) || 0;
  const cf = parseFloat(cantina) || 0;

  async function save() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId, platformFeePct: pf, cantinaFeePct: cf }),
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
          <p className="font-semibold">Politica commissioni</p>
          <p className="text-amber-300/70 text-xs leading-relaxed">
            Tutte le commissioni sono <strong className="text-amber-300">a carico dell&apos;acquirente</strong> e vengono
            aggiunte al prezzo del certificato. Il venditore riceve sempre l&apos;importo esatto del prezzo listato.
            Le commissioni appaiono come voci separate nel checkout Stripe.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commissioni di piattaforma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Platform fee */}
          <div className="space-y-1.5">
            <Label>Commissione di servizio (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
            />
            <p className="text-xs text-white/40">
              Aggiunta al prezzo in ogni acquisto (primario e secondario). Trattenuta dalla piattaforma.
            </p>
          </div>

          {/* Cantina royalty */}
          <div className="space-y-1.5">
            <Label>Royalty cantina su rivendita (%)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={cantina}
              onChange={e => setCantina(e.target.value)}
            />
            <p className="text-xs text-white/40">
              Aggiunta al prezzo solo nelle vendite secondarie (collezionista → collezionista). Riconosciuta alla cantina originale.
            </p>
          </div>

          {/* Live preview */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm space-y-3">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Esempio con certificato da € 100,00</p>
            <div className="space-y-2">
              <div className="font-semibold text-white/70 text-xs mt-1">Vendita primaria (cantina → acquirente)</div>
              <div className="flex justify-between text-xs"><span className="text-white/50">Prezzo certificato</span><span>€ 100,00</span></div>
              <div className="flex justify-between text-xs text-amber-400"><span>+ Commissione Wine Bank 24 ({pf}%)</span><span>€ {pf.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs font-bold border-t border-white/10 pt-2"><span>Totale a carico acquirente</span><span>€ {(100 + pf).toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-green-400"><span>Cantina riceve</span><span>€ 100,00</span></div>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="font-semibold text-white/70 text-xs mt-1">Vendita secondaria (collezionista → acquirente)</div>
              <div className="flex justify-between text-xs"><span className="text-white/50">Prezzo certificato</span><span>€ 100,00</span></div>
              <div className="flex justify-between text-xs text-amber-400"><span>+ Commissione Wine Bank 24 ({pf}%)</span><span>€ {pf.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-amber-400"><span>+ Royalty cantina ({cf}%)</span><span>€ {cf.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs font-bold border-t border-white/10 pt-2"><span>Totale a carico acquirente</span><span>€ {(100 + pf + cf).toFixed(2)}</span></div>
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
