"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Flame } from "lucide-react";

export function BurnApproveButton({ burnRequestId, nftId }: { burnRequestId: string; nftId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function approve() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/burn-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ burnRequestId, nftId }),
      });
      if (!res.ok) throw new Error();
      toast.success("NFT bruciato — bottiglia confermata per la spedizione");
      router.refresh();
    } catch {
      toast.error("Errore nell'approvazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={approve}
      disabled={loading}
      size="sm"
      className="bg-red-600 hover:bg-red-700 text-white shrink-0"
    >
      <Flame className="w-3 h-3 mr-1" />
      {loading ? "Burning..." : "Approva & Burn"}
    </Button>
  );
}
