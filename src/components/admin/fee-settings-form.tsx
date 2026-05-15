"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function FeeSettingsForm({ configId, platformFeePct, cantinaFeePct }: {
  configId: string;
  platformFeePct: number;
  cantinaFeePct: number;
}) {
  const [platform, setPlatform] = useState(platformFeePct.toString());
  const [cantina, setCantina] = useState(cantinaFeePct.toString());
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId, platformFeePct: parseFloat(platform), cantinaFeePct: parseFloat(cantina) }),
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
    <Card>
      <CardHeader><CardTitle>Fee di piattaforma</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Fee piattaforma (%)</Label>
          <Input type="number" step="0.1" min="0" max="50" value={platform} onChange={e => setPlatform(e.target.value)} />
          <p className="text-xs text-stone-500">Percentuale trattenuta dalla piattaforma su ogni transazione</p>
        </div>
        <div className="space-y-1">
          <Label>Royalty cantina (%)</Label>
          <Input type="number" step="0.1" min="0" max="50" value={cantina} onChange={e => setCantina(e.target.value)} />
          <p className="text-xs text-stone-500">Royalty spettante alla cantina su ogni rivendita secondaria</p>
        </div>
        <Button onClick={save} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950">
          {loading ? "Salvataggio..." : "Salva configurazione"}
        </Button>
      </CardContent>
    </Card>
  );
}
