"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function UserActions({ userId, isBlocked }: { userId: string; isBlocked: boolean }) {
  const [blocked, setBlocked] = useState(isBlocked);
  const [loading, setLoading] = useState(false);

  async function toggleBlock() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/block`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !blocked }),
      });
      if (!res.ok) throw new Error();
      setBlocked(!blocked);
      toast.success(blocked ? "Utente sbloccato" : "Utente bloccato");
    } catch {
      toast.error("Errore nell'operazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={blocked ? "outline" : "destructive"}
      size="sm"
      onClick={toggleBlock}
      disabled={loading}
    >
      {blocked ? "Sblocca" : "Blocca"}
    </Button>
  );
}
