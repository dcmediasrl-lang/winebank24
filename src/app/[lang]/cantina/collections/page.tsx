import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateCollectionDialog } from "@/components/cantina/create-collection-dialog";
import { MintNftDialog } from "@/components/cantina/mint-nft-dialog";

export default async function CantinaCollectionsPage() {
  const session = await auth();
  const cantina = await db.cantina.findUnique({ where: { userId: session!.user.id } });

  const collections = await db.collection.findMany({
    where: { cantinaId: cantina?.id },
    include: { _count: { select: { nfts: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Le mie Collezioni</h1>
        {cantina && <CreateCollectionDialog cantinaId={cantina.id} />}
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-16 text-[var(--wine-muted)]">
          <p className="text-lg mb-2">Nessuna collezione ancora</p>
          <p className="text-sm">Crea la tua prima collezione per iniziare a mintare NFT</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <Card key={col.id} className="hover:shadow-md transition-shadow">
              {col.coverImage && (
                <div className="h-40 overflow-hidden rounded-t-lg">
                  <img src={col.coverImage} alt={col.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{col.name}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {col.vintage && <Badge variant="outline">{col.vintage}</Badge>}
                  {col.grape && <Badge variant="outline">{col.grape}</Badge>}
                  {col.region && <Badge variant="secondary">{col.region}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[var(--wine-muted)] mb-3">
                  {col._count.nfts} / {col.totalSupply} NFT mintati
                </p>
                <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
                  <div
                    className="bg-[#993300] h-1.5 rounded-full"
                    style={{ width: `${(col._count.nfts / col.totalSupply) * 100}%` }}
                  />
                </div>
                {cantina && col._count.nfts < col.totalSupply && (
                  <MintNftDialog collectionId={col.id} cantinaId={cantina.id} collectionName={col.name} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
