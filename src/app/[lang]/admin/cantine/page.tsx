import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCantinaDialog } from "@/components/admin/create-cantina-dialog";

export default async function AdminCantinePage() {
  const cantine = await db.cantina.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, isBlocked: true } },
      _count: { select: { collections: true, nfts: true } },
    },
  });

  type CantinaItem = typeof cantine[number];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Gestione Cantine</h1>
        <CreateCantinaDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cantine registrate ({cantine.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {cantine.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-8">
              Nessuna cantina ancora. Creane una con il pulsante in alto a destra.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-stone-500 text-left">
                    <th className="pb-3 pr-4">Cantina</th>
                    <th className="pb-3 pr-4">Email accesso</th>
                    <th className="pb-3 pr-4">Località</th>
                    <th className="pb-3 pr-4">P.IVA</th>
                    <th className="pb-3 pr-4">Collezioni</th>
                    <th className="pb-3 pr-4">NFT</th>
                    <th className="pb-3">Stato</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cantine.map((c: CantinaItem) => (
                    <tr key={c.id}>
                      <td className="py-3 pr-4 font-semibold">{c.name}</td>
                      <td className="py-3 pr-4 text-stone-500">{c.user.email}</td>
                      <td className="py-3 pr-4 text-stone-500">{c.location ?? "—"}</td>
                      <td className="py-3 pr-4 text-stone-500">{c.vatNumber ?? "—"}</td>
                      <td className="py-3 pr-4 text-center">{c._count.collections}</td>
                      <td className="py-3 pr-4 text-center">{c._count.nfts}</td>
                      <td className="py-3">
                        <Badge variant={c.user.isBlocked ? "destructive" : "outline"}>
                          {c.user.isBlocked ? "Bloccata" : "Attiva"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
