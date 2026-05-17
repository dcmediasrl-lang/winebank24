import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserActions } from "@/components/admin/user-actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, role: true,
      isBlocked: true, createdAt: true, emailVerified: true,
      cantina: { select: { name: true, isVerified: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Gestione Utenti & Cantine</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tutti gli utenti ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-[var(--wine-muted)] text-left">
                  <th className="pb-3 pr-4">Nome</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Ruolo</th>
                  <th className="pb-3 pr-4">Stato</th>
                  <th className="pb-3 pr-4">Registrato</th>
                  <th className="pb-3">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="py-3">
                    <td className="py-3 pr-4 font-medium">
                      {u.name || "—"}
                      {u.cantina && (
                        <span className="block text-xs text-white/40">{u.cantina.name}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-white/70">{u.email}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={u.role === "ADMIN" ? "destructive" : u.role === "CANTINA" ? "default" : "secondary"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant={u.isBlocked ? "destructive" : "outline"}>
                          {u.isBlocked ? "Bloccato" : "Attivo"}
                        </Badge>
                        {!u.emailVerified && (
                          <Badge variant="secondary" className="text-xs">Email non verificata</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-white/40">
                      {new Date(u.createdAt).toLocaleDateString("it-IT")}
                    </td>
                    <td className="py-3">
                      <UserActions userId={u.id} isBlocked={u.isBlocked} emailVerified={!!u.emailVerified} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
