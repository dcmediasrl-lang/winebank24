import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BuyButton } from "@/components/collector/buy-button";
import { InvestFractionDialog } from "@/components/collector/invest-fraction-dialog";
import { auth } from "@/lib/auth";
import { Wine, TrendingUp } from "lucide-react";

export default async function MarketplacePage() {
  const session = await auth();
  const allListedNfts = await db.nft.findMany({
    where: { isListed: true, status: "LISTED" },
    include: {
      cantina: { select: { name: true } },
      collection: { select: { name: true, vintage: true, grape: true } },
      owner: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const nfts = allListedNfts.filter((n) => !n.isFractionable);
  const fractionableNfts = allListedNfts.filter((n) => n.isFractionable);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Wine className="w-8 h-8 text-amber-600" />
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Marketplace</h1>
            <p className="text-stone-500">Acquista NFT di bottiglie di vino pregiate</p>
          </div>
        </div>

        {/* Fractionable NFTs — investment section */}
        {fractionableNfts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-bold text-stone-900">Investi in una bottiglia</h2>
            </div>
            <p className="text-stone-500 text-sm mb-5">Acquista una quota di un'esclusiva bottiglia di vino. La bottiglia rimane custodita dalla cantina.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {fractionableNfts.map((nft) => {
                const totalValue = Number(nft.totalValue ?? 0);
                const availableValue = Number(nft.availableValue ?? 0);
                const soldPct = totalValue > 0 ? ((totalValue - availableValue) / totalValue) * 100 : 0;
                return (
                  <Card key={nft.id} className="overflow-hidden hover:shadow-lg transition-shadow group border-amber-200">
                    <div className="h-48 bg-stone-200 overflow-hidden relative">
                      {nft.imageUrl ? (
                        <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Wine className="w-12 h-12 text-stone-400" />
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-amber-500 text-stone-950 text-xs">Frazionabile</Badge>
                    </div>
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-sm font-semibold leading-tight">{nft.name}</CardTitle>
                      <p className="text-xs text-stone-500">{nft.cantina.name}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {nft.collection.vintage && <Badge variant="outline" className="text-xs">{nft.collection.vintage}</Badge>}
                        {nft.collection.grape && <Badge variant="secondary" className="text-xs">{nft.collection.grape}</Badge>}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-stone-500">
                          <span>Valore totale: <span className="font-semibold text-stone-800">€ {totalValue.toFixed(2)}</span></span>
                          <span>{soldPct.toFixed(1)}% venduto</span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-1.5">
                          <div
                            className="bg-amber-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(soldPct, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-green-700 font-medium">Disponibile: € {availableValue.toFixed(2)}</p>
                      </div>
                      <InvestFractionDialog
                        nftId={nft.id}
                        nftName={nft.name}
                        totalValue={totalValue}
                        availableValue={availableValue}
                        isLoggedIn={!!session}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Regular NFTs */}
        {nfts.length === 0 && fractionableNfts.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p className="text-lg">Nessun NFT disponibile al momento</p>
          </div>
        ) : nfts.length > 0 ? (
          <>
            {fractionableNfts.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Wine className="w-5 h-5 text-amber-600" />
                <h2 className="text-xl font-bold text-stone-900">Acquista una bottiglia</h2>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {nfts.map((nft) => (
                <Card key={nft.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="h-48 bg-stone-200 overflow-hidden relative">
                    {nft.imageUrl ? (
                      <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Wine className="w-12 h-12 text-stone-400" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-semibold leading-tight">{nft.name}</CardTitle>
                    <p className="text-xs text-stone-500">{nft.cantina.name}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {nft.collection.vintage && <Badge variant="outline" className="text-xs">{nft.collection.vintage}</Badge>}
                      {nft.collection.grape && <Badge variant="secondary" className="text-xs">{nft.collection.grape}</Badge>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-stone-900">€ {nft.price?.toFixed(2)}</span>
                      <span className="text-xs text-stone-400">Bottiglia #{nft.bottleNumber}</span>
                    </div>
                    {session?.user.id !== nft.owner.id ? (
                      <BuyButton nftId={nft.id} price={nft.price!} nftName={nft.name} isLoggedIn={!!session} />
                    ) : (
                      <Badge variant="outline" className="w-full justify-center py-1.5">Il tuo NFT</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : null}
    </div>
  );
}
