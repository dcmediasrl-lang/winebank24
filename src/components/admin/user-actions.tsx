"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserActions({
  userId,
  isBlocked,
  emailVerified,
}: {
  userId: string;
  isBlocked: boolean;
  emailVerified: boolean;
}) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(isBlocked);
  const [verified, setVerified] = useState(emailVerified);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function verifyEmail() {
    setVerifying(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify-email`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      setVerified(true);
      toast.success("Email verificata manualmente");
    } catch {
      toast.error("Errore nella verifica");
    } finally {
      setVerifying(false);
    }
  }

  async function deleteUser() {
    if (!confirm("Eliminare definitivamente questo utente?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Utente eliminato");
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore durante l'eliminazione");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!verified && (
        <Button
          variant="outline"
          size="sm"
          onClick={verifyEmail}
          disabled={verifying}
          className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          {verifying ? "..." : "Verifica email"}
        </Button>
      )}
      <Button
        variant={blocked ? "outline" : "destructive"}
        size="sm"
        onClick={toggleBlock}
        disabled={loading}
      >
        {blocked ? "Sblocca" : "Blocca"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={deleteUser}
        disabled={deleting}
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
