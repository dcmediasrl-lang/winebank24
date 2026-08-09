import { requireSession } from "@/lib/require-session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Package, TrendingUp } from "lucide-react";

export default async function CantinaDashboard() {
  const session = await requireSession();
  const cantina = await db.cantina.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: { select: { collections: true, nfts: true } },
    },
  });

  const revenue = await db.transaction.aggregate({
    where: { nft: { cantinaId: cantina?.id } },
    _sum: { cantinaFee: true, amount: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">
        Benvenuta, {cantina?.name || "Cantina"}
      </h1>
      <p className="text-[var(--wine-muted)] mb-6">Gestisci i tuoi certificati digitali di bottiglia</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Certificati emessi" value={cantina?._count.nfts ?? 0} icon={Gem} color="text-amber-600" />
        <StatCard title="Royalties (€)" value={`€ ${(revenue._sum.cantinaFee ?? 0).toFixed(2)}`} icon={TrendingUp} color="text-green-600" />
        <StatCard title="Fatturato (€)" value={`€ ${(revenue._sum.amount ?? 0).toFixed(2)}`} icon={Package} color="text-blue-600" />
      </div>

      <RecentNfts cantinaId={cantina?.id} />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[var(--wine-muted)]">{title}</CardTitle>
        <Icon className={`w-5 h-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{value}</div>
      </CardContent>
    </Card>
  );
}

async function RecentNfts({ cantinaId }: { cantinaId?: string }) {
  if (!cantinaId) return null;
  const nfts = await db.nft.findMany({
    where: { cantinaId },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { collection: { select: { name: true } } },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Ultimi NFT mintati</CardTitle></CardHeader>
      <CardContent>
        {nfts.length === 0 ? (
          <p className="text-white/40 text-sm">Nessun certificato ancora. Vai in <strong>I miei certificati</strong> per creare il primo.</p>
        ) : (
          <div className="space-y-3">
            {nfts.map((nft) => (
              <div key={nft.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{nft.name}</p>
                  <p className="text-white/40 text-xs">Bottiglia #{nft.bottleNumber}{nft.vintage ? ` · ${nft.vintage}` : ""}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  nft.status === "LISTED" ? "bg-green-900/40 text-green-400" :
                  nft.status === "SOLD" ? "bg-blue-900/40 text-blue-400" :
                  nft.status === "BURNED" ? "bg-red-900/40 text-red-400" :
                  "bg-white/10 text-white/60"
                }`}>{nft.status}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
