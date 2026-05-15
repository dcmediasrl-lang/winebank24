import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Package, TrendingUp, Wine } from "lucide-react";

export default async function CantinaDashboard() {
  const session = await auth();
  const cantina = await db.cantina.findUnique({
    where: { userId: session!.user.id },
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
      <h1 className="text-2xl font-bold text-stone-900 mb-2">
        Benvenuta, {cantina?.name || "Cantina"}
      </h1>
      <p className="text-stone-500 mb-6">Gestisci le tue collezioni e i tuoi NFT</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Collezioni" value={cantina?._count.collections ?? 0} icon={Wine} color="text-amber-600" />
        <StatCard title="NFT mintati" value={cantina?._count.nfts ?? 0} icon={Gem} color="text-purple-600" />
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
        <CardTitle className="text-sm font-medium text-stone-500">{title}</CardTitle>
        <Icon className={`w-5 h-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-stone-900">{value}</div>
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
          <p className="text-stone-400 text-sm">Nessun NFT ancora. Crea una collezione per iniziare.</p>
        ) : (
          <div className="space-y-3">
            {nfts.map((nft) => (
              <div key={nft.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{nft.name}</p>
                  <p className="text-stone-400 text-xs">{nft.collection.name} · Bottiglia #{nft.bottleNumber}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  nft.status === "LISTED" ? "bg-green-100 text-green-700" :
                  nft.status === "SOLD" ? "bg-blue-100 text-blue-700" :
                  nft.status === "BURNED" ? "bg-red-100 text-red-700" :
                  "bg-stone-100 text-stone-700"
                }`}>{nft.status}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
