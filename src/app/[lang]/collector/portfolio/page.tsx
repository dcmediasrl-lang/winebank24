import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListNftButton } from "@/components/collector/list-nft-button";
import { DeliveryRequestButton } from "@/components/collector/delivery-request-button";
import { ListFractionButton } from "@/components/collector/list-fraction-button";
import { NftImageGallery } from "@/components/shared/nft-image-gallery";
import { TrendingUp, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function CollectorPortfolioPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const session = await auth();
  const [nfts, fractions] = await Promise.all([
    db.nft.findMany({
      where: { ownerId: session!.user.id, status: { not: "BURNED" } },
      include: {
        collection: { select: { name: true } },
        cantina: { select: { name: true } },
        burnRequest: { select: { id: true } },
      },
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
        <h1 className="text-2xl font-bold text-white mb-6">La mia Collezione</h1>
        {nfts.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <p className="text-lg mb-2">Nessun NFT in tuo possesso</p>
            <p className="text-sm">Visita il Marketplace per acquistare il tuo primo NFT</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <Card key={nft.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <Link href={`/${lang}/nft/${nft.id}`}>
                  <NftImageGallery
                    images={nft.imageGallery ?? []}
                    fallbackUrl={nft.imageUrl ?? undefined}
                    alt={nft.name}
                    className="h-44"
                  />
                </Link>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/${lang}/nft/${nft.id}`} className="hover:text-amber-400 transition-colors">
                        <CardTitle className="text-base truncate">{nft.name}</CardTitle>
                      </Link>
                      <div className="text-xs text-white/40">{nft.cantina.name} · {nft.collection.name}</div>
                    </div>
                    <Link href={`/${lang}/nft/${nft.id}`} className="text-white/30 hover:text-amber-400 transition-colors shrink-0 mt-0.5">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={nft.isListed ? "default" : "secondary"}>
                      {nft.isListed ? "In vendita" : "In collezione"}
                    </Badge>
                    {nft.price && <span className="font-semibold text-white">€ {nft.price.toFixed(2)}</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <ListNftButton nftId={nft.id} isListed={nft.isListed} price={nft.price} />
                    {!nft.isFractionable && (
                      <DeliveryRequestButton
                        nftId={nft.id}
                        nftName={nft.name}
                        bottleValue={nft.price ?? 0}
                        physicalDeliveryUnlocked={nft.physicalDeliveryUnlocked}
                        shippingCost={nft.shippingCost}
                        alreadyRequested={!!nft.burnRequest}
                        compact
                      />
                    )}
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
          <h2 className="text-xl font-bold text-white">Le mie co-proprietà</h2>
        </div>
        {fractions.length === 0 ? (
          <div className="text-center py-12 text-white/40 bg-[var(--wine-card)] rounded-lg border border-[var(--wine-border)]">
            <p className="text-base mb-1">Nessuna quota in tuo possesso</p>
            <p className="text-sm">Acquista una quota di co-proprietà nel Marketplace</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fractions.map((fraction) => (
              <Card key={fraction.id} className="overflow-hidden hover:shadow-md transition-shadow border-amber-100">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <Link href={`/${lang}/nft/${fraction.nft.id}`} className="hover:text-amber-400 transition-colors">
                        <CardTitle className="text-base truncate">{fraction.nft.name}</CardTitle>
                      </Link>
                      <div className="text-xs text-white/40">{fraction.nft.cantina.name} · {fraction.nft.collection.name}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Badge className="bg-amber-100 text-amber-800 text-xs">Quota</Badge>
                      <Link href={`/${lang}/nft/${fraction.nft.id}`} className="text-white/30 hover:text-amber-400 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md bg-[var(--wine-card)] p-2 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--wine-muted)]">Quota di proprietà:</span>
                      <span className="font-bold text-amber-700">{Number(fraction.percentage).toFixed(4)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--wine-muted)]">Valore acquisto:</span>
                      <span className="font-semibold text-white">€ {Number(fraction.investedAmount).toFixed(2)}</span>
                    </div>
                    {fraction.isListed && fraction.askingPrice && (
                      <div className="flex justify-between">
                        <span className="text-[var(--wine-muted)]">Prezzo di vendita:</span>
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
