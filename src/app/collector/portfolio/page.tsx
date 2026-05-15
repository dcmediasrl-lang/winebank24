import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListNftButton } from "@/components/collector/list-nft-button";
import { BurnRequestButton } from "@/components/collector/burn-request-button";

export default async function CollectorPortfolioPage() {
  const session = await auth();
  const nfts = await db.nft.findMany({
    where: { ownerId: session!.user.id, status: { not: "BURNED" } },
    include: { collection: { select: { name: true } }, cantina: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">La mia Vetrina</h1>
      {nfts.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-lg mb-2">Nessun NFT in tuo possesso</p>
          <p className="text-sm">Visita il Marketplace per acquistare il tuo primo NFT</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nfts.map((nft) => (
            <Card key={nft.id} className="overflow-hidden hover:shadow-md transition-shadow">
              {nft.imageUrl && (
                <div className="h-44 overflow-hidden">
                  <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{nft.name}</CardTitle>
                <div className="text-xs text-stone-400">{nft.cantina.name} · {nft.collection.name}</div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={nft.isListed ? "default" : "secondary"}>
                    {nft.isListed ? "In vendita" : "In collezione"}
                  </Badge>
                  {nft.price && <span className="font-semibold text-stone-800">€ {nft.price.toFixed(2)}</span>}
                </div>
                <div className="flex gap-2">
                  <ListNftButton nftId={nft.id} isListed={nft.isListed} price={nft.price} />
                  <BurnRequestButton nftId={nft.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
