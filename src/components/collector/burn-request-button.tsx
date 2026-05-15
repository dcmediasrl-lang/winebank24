"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Flame } from "lucide-react";
import { useRouter } from "next/navigation";

export function BurnRequestButton({ nftId }: { nftId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/collector/burn-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nftId, address, notes }),
      });
      if (!res.ok) throw new Error();
      toast.success("Richiesta bottiglia fisica inviata! L'admin la processerà a breve.");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Errore nell'invio della richiesta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 text-red-600 border-red-200 hover:bg-red-50")}>
        <Flame className="w-3 h-3 mr-1" /> Richiedi bottiglia
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Richiesta bottiglia fisica</DialogTitle></DialogHeader>
        <p className="text-sm text-stone-500">
          Richiedendo la bottiglia fisica, il tuo NFT verrà bruciato (burn) e non sarà più trasferibile.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Indirizzo di spedizione *</Label>
            <Textarea required value={address} onChange={e => setAddress(e.target.value)} rows={3} placeholder="Via Roma 1, 00100 Roma, Italia" />
          </div>
          <div className="space-y-1">
            <Label>Note aggiuntive</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Orari di consegna, etc." />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white">
            {loading ? "Invio..." : "Conferma richiesta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
