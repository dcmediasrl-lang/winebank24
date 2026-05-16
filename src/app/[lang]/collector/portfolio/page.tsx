import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListNftButton } from "@/components/collector/list-nft-button";
import { BurnRequestButton } from "@/components/collector/burn-request-button";
import { ListFractionButton } from "@/components/collector/list-fraction-button";
import { NftImageGallery } from "@/components/shared/nft-image-gallery";
import { TrendingUp } from "lucide-react";

export default async function CollectorPortfolioPage() {
  const session = await auth();
  const [nfts, fractions] = await Promise.all([
    db.nft.findMany({
      where: { ownerId: session!.user.id, status: { not: "BURNED" } },
      include: { collection: { select: { name: true } }, cantina: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.nftFraction.findMany({
      where: { ownerId: session!.user.id },
      include: {
        nft: {
          include: {
            cantina: { select: { name: true } },
            collection: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 mb-6">La mia Collezione</h1>
        {nfts.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="text-lg mb-2">Nessun NFT in tuo possesso</p>
            <p className="text-sm">Visita il Marketplace per acquistare il tuo primo NFT</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <Card key={nft.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <NftImageGallery
                  images={(nft as any).imageGallery ?? []}
                  fallbackUrl={nft.imageUrl ?? undefined}
                  alt={nft.name}
                  className="h-44"
                />
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

      {/* Fractions section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl font-bold text-stone-900">Le mie co-proprietà</h2>
        </div>
        {fractions.length === 0 ? (
          <div className="text-center py-12 text-stone-400 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-base mb-1">Nessuna quota in tuo possesso</p>
            <p className="text-sm">Acquista una quota di co-proprietà nel Marketplace</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fractions.map((fraction) => (
              <Card key={fraction.id} className="overflow-hidden hover:shadow-md transition-shadow border-amber-100">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{fraction.nft.name}</CardTitle>
                      <div className="text-xs text-stone-400">{fraction.nft.cantina.name} · {fraction.nft.collection.name}</div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 text-xs shrink-0 ml-2">Quota</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md bg-stone-50 p-2 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Quota di proprietà:</span>
                      <span className="font-bold text-amber-700">{Number(fraction.percentage).toFixed(4)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Valore acquisto:</span>
                      <span className="font-semibold text-stone-800">€ {Number(fraction.investedAmount).toFixed(2)}</span>
                    </div>
                    {fraction.isListed && fraction.askingPrice && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Prezzo di vendita:</span>
                        <span className="font-semibold text-green-700">€ {Number(fraction.askingPrice).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={fraction.isListed ? "default" : "secondary"} className="text-xs">
                      {fraction.isListed ? "Disponibile" : "In collezione"}
                    </Badge>
                    {fraction.nft.status === "LIQUIDATION_REQUESTED" && (
                      <Badge variant="destructive" className="text-xs">Liquidazione richiesta</Badge>
                    )}
                  </div>
                  <ListFractionButton
                    fractionId={fraction.id}
                    isListed={fraction.isListed}
                    askingPrice={fraction.askingPrice ? Number(fraction.askingPrice) : null}
                    ownedPercentage={Number(fraction.percentage)}
                    investedAmount={Number(fraction.investedAmount)}
                    listedPercentage={fraction.listedPercentage ? Number(fraction.listedPercentage) : null}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
