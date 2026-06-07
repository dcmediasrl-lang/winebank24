"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, Trash2, ShieldCheck, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

type Role = "ADMIN" | "CANTINA" | "COLLECTOR";

const ROLES: { value: Role; label: string; color: string }[] = [
  { value: "ADMIN",     label: "Admin",       color: "text-red-400" },
  { value: "CANTINA",   label: "Cantina",     color: "text-amber-400" },
  { value: "COLLECTOR", label: "Collezionista", color: "text-blue-400" },
];

export function UserActions({
  userId,
  isBlocked,
  emailVerified,
  currentRole,
}: {
  userId: string;
  isBlocked: boolean;
  emailVerified: boolean;
  currentRole: Role;
}) {
  const router = useRouter();
  const [blocked, setBlocked] = useState(isBlocked);
  const [verified, setVerified] = useState(emailVerified);
  const [role, setRole] = useState<Role>(currentRole);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);

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
      const res = await fetch(`/api/admin/users/${userId}/verify-email`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      setVerified(true);
      toast.success("Email verificata manualmente");
    } catch {
      toast.error("Errore nella verifica");
    } finally {
      setVerifying(false);
    }
  }

  async function changeRole(newRole: Role) {
    if (newRole === role) { setRoleOpen(false); return; }
    setRoleLoading(true);
    setRoleOpen(false);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRole(newRole);
      toast.success(`Ruolo cambiato in ${newRole}`);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Errore nel cambio ruolo");
    } finally {
      setRoleLoading(false);
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

  const currentRoleInfo = ROLES.find(r => r.value === role)!;

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* Role selector */}
      <div className="relative">
        <button
          onClick={() => setRoleOpen(v => !v)}
          disabled={roleLoading}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${currentRoleInfo.color} border-white/15 hover:border-white/30 bg-white/5`}
        >
          <ShieldCheck className="w-3 h-3" />
          {roleLoading ? "..." : currentRoleInfo.label}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {roleOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setRoleOpen(false)} />
            <div className="absolute left-0 top-full mt-1 z-20 w-36 rounded-lg border border-white/15 bg-[#1a0f0f] shadow-xl overflow-hidden">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => changeRole(r.value)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/10 transition-colors ${r.color} ${r.value === role ? "bg-white/10 font-bold" : ""}`}
                >
                  {r.value === role && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
                  {r.value !== role && <span className="w-1.5 h-1.5 shrink-0" />}
                  {r.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Verify email */}
      {!verified && (
        <Button
          variant="outline"
          size="sm"
          onClick={verifyEmail}
          disabled={verifying}
          className="text-green-400 border-green-800 hover:bg-green-950 text-xs"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          {verifying ? "..." : "Verifica"}
        </Button>
      )}

      {/* Block/Unblock */}
      <Button
        variant={blocked ? "outline" : "destructive"}
        size="sm"
        onClick={toggleBlock}
        disabled={loading}
        className="text-xs"
      >
        {loading ? "..." : blocked ? "Sblocca" : "Blocca"}
      </Button>

      {/* Delete */}
      <Button
        variant="ghost"
        size="sm"
        onClick={deleteUser}
        disabled={deleting}
        className="text-red-500 hover:bg-red-950 hover:text-red-400 px-2"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
