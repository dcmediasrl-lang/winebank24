import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BuyButton } from "@/components/collector/buy-button";
import { InvestFractionDialog } from "@/components/collector/invest-fraction-dialog";
import { BuyFractionButton } from "@/components/collector/buy-fraction-button";
import { MakeOfferButton } from "@/components/collector/make-offer-button";
import { FavoriteButton } from "@/components/collector/favorite-button";
import { NftImageGallery } from "@/components/shared/nft-image-gallery";
import { AdSenseBanner } from "@/components/shared/adsense-banner";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Wine, Users, Filter } from "lucide-react";

export default async function MarketplacePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ region?: string; type?: string; q?: string }>;
}) {
  const { lang } = await params;
  const { region: filterRegion, type: filterType } = await searchParams;
  const session = await auth();

  // Check whether the logged-in user has already accepted buyer terms and completed KYC
  let needsTermsAcceptance = false;
  let kycComplete = false;
  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        buyerContractAcceptedAt: true,
        firstName: true, lastName: true,
        birthDate: true, country: true, fiscalCode: true,
      },
    }).catch(() => null);
    needsTermsAcceptance = !user?.buyerContractAcceptedAt;
    kycComplete = !!(user?.firstName && user?.lastName && user?.birthDate && user?.country && user?.fiscalCode);
  }

  const userFavoriteIds = session?.user?.id
    ? await db.favoriteNft
        .findMany({ where: { userId: session.user.id }, select: { nftId: true } })
        .then((fs) => new Set(fs.map((f) => f.nftId)))
        .catch(() => new Set<string>())
    : new Set<string>();

  const [allListedNfts, listedFractions] = await Promise.all([
    db.nft.findMany({
      where: {
        isListed: true,
        status: "LISTED",
        ...(filterRegion || filterType
          ? {
              denomination: {
                ...(filterRegion ? { region: filterRegion } : {}),
                ...(filterType ? { type: filterType } : {}),
              },
            }
          : {}),
      },
      include: {
        cantina: { select: { id: true, name: true } },
        collection: { select: { name: true, vintage: true, grape: true } },
        owner: { select: { id: true, name: true } },
        denomination: { select: { name: true, type: true, region: true } },
      },
      orderBy: { updatedAt: "desc" },
    }).catch(() => [] as any[]),
    db.nftFraction.findMany({
      where: { isListed: true },
      include: {
        nft: {
          include: {
            cantina: { select: { name: true } },
            collection: { select: { name: true, vintage: true } },
          },
        },
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    }).catch(() => [] as any[]),
  ]);

  const nfts = allListedNfts.filter((n) => !n.isFractionable);
  const fractionableNfts = allListedNfts.filter((n) => n.isFractionable);
  // Exclude fractions owned by the current user
  const availableFractions = listedFractions.filter((f) => f.ownerId !== session?.user.id);

  // Unique regions from currently listed NFTs (with denomination data)
  const uniqueRegions = Array.from(
    new Set(allListedNfts.map((n) => n.denomination?.region).filter(Boolean) as string[])
  ).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10" style={{ color: "white" }}>
        <div className="flex items-center gap-3 mb-6">
          <Wine className="w-8 h-8 text-[#df071b]" />
          <div>
            <h1 className="text-3xl font-bold text-white">Marketplace</h1>
            <p className="text-[var(--wine-muted)]">Acquista NFT di bottiglie di vino pregiate</p>
          </div>
        </div>

        {/* Filter bar */}
        {(uniqueRegions.length > 0 || filterRegion || filterType) && (
          <div className="flex flex-wrap items-center gap-2 mb-8 p-3 rounded-lg bg-[var(--wine-card)] border border-[var(--wine-border)]">
            <Filter className="w-4 h-4 text-white/40 shrink-0" />
            <span className="text-xs text-white/40 mr-1">Filtri:</span>

            {/* Type filters */}
            {["DOCG", "DOC"].map((t) => (
              <Link
                key={t}
                href={filterType === t ? `/${lang}/marketplace` : `/${lang}/marketplace?type=${t}`}
                className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${
                  filterType === t
                    ? t === "DOCG"
                      ? "bg-red-700 border-red-700 text-white"
                      : "bg-orange-600 border-orange-600 text-white"
                    : "border-white/20 text-white/60 hover:border-white/40"
                }`}
              >
                {t}
              </Link>
            ))}

            {/* Region filters */}
            {uniqueRegions.map((r) => (
              <Link
                key={r}
                href={filterRegion === r ? `/${lang}/marketplace` : `/${lang}/marketplace?region=${encodeURIComponent(r)}`}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  filterRegion === r
                    ? "bg-amber-500 border-amber-500 text-stone-950 font-medium"
                    : "border-white/20 text-white/60 hover:border-white/40"
                }`}
              >
                {r}
              </Link>
            ))}

            {(filterRegion || filterType) && (
              <Link
                href={`/${lang}/marketplace`}
                className="text-xs text-white/40 hover:text-white ml-auto"
              >
                Rimuovi filtri ✕
              </Link>
            )}
          </div>
        )}

        {/* Fractionable NFTs — co-ownership section */}
        {fractionableNfts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#df071b]" />
              <h2 className="text-xl font-bold text-white">Diventa co-proprietario</h2>
            </div>
            <p className="text-[var(--wine-muted)] text-sm mb-5">Acquista una quota di un'esclusiva bottiglia di vino. La bottiglia originale è custodita e certificata dalla cantina.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {fractionableNfts.map((nft) => {
                const totalValue = Number(nft.totalValue ?? 0);
                const availableValue = Number(nft.availableValue ?? 0);
                const soldPct = totalValue > 0 ? ((totalValue - availableValue) / totalValue) * 100 : 0;
                return (
                  <Card key={nft.id} className="overflow-hidden hover:shadow-lg transition-shadow group border-amber-200 relative">
                    <div className="h-48 relative">
                      <NftImageGallery
                        images={nft.imageGallery ?? []}
                        fallbackUrl={nft.imageUrl ?? undefined}
                        alt={nft.name}
                        className="h-48"
                      />
                      <Badge className="absolute top-2 right-2 bg-[#993300] text-white text-xs z-10">Co-proprietà</Badge>
                      {session && (
                        <div className="absolute top-2 left-2 z-10">
                          <FavoriteButton nftId={nft.id} initialFavorited={userFavoriteIds.has(nft.id)} />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-sm font-semibold leading-tight">
                        <Link href={`/${lang}/nft/${nft.id}`} className="hover:text-amber-400 transition-colors">
                          {nft.name}
                        </Link>
                      </CardTitle>
                      <p className="text-xs text-[var(--wine-muted)]">
                        {nft.cantina.name}{" "}
                        <Link href={`/${lang}/cantine/${nft.cantina.id}`} className="text-amber-600 hover:underline">
                          Vedi cantina
                        </Link>
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {nft.collection.vintage && <Badge variant="outline" className="text-xs">{nft.collection.vintage}</Badge>}
                        {nft.collection.grape && <Badge variant="secondary" className="text-xs">{nft.collection.grape}</Badge>}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-[var(--wine-muted)]">
                          <span>Valore totale: <span className="font-semibold text-white">€ {totalValue.toFixed(2)}</span></span>
                          <span>{soldPct.toFixed(1)}% venduto</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
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
                        needsTermsAcceptance={!!session && needsTermsAcceptance}
                        kycComplete={!session || kycComplete}
                      />
                      {session?.user.id !== nft.owner.id && availableValue > 0 && (
                        <MakeOfferButton
                          nftId={nft.id}
                          listedPrice={totalValue}
                          isLoggedIn={!!session}
                          currentUserId={session?.user.id}
                          sellerId={nft.owner.id}
                          kycComplete={!session || kycComplete}
                        />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Listed fractions from collectors */}
        {availableFractions.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Certificati di co-proprietà disponibili</h2>
            </div>
            <p className="text-[var(--wine-muted)] text-sm mb-5">Certificati di co-proprietà di bottiglie ceduti da altri collezionisti.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {availableFractions.map((fraction) => (
                <Card key={fraction.id} className="overflow-hidden hover:shadow-lg transition-shadow border-blue-100">
                  <div className="h-48 relative">
                    <NftImageGallery
                      images={fraction.nft.imageGallery ?? []}
                      fallbackUrl={fraction.nft.imageUrl ?? undefined}
                      alt={fraction.nft.name}
                      className="h-48"
                    />
                    <Badge className="absolute top-2 right-2 bg-blue-500 text-white text-xs z-10">Quota</Badge>
                  </div>
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-semibold leading-tight">{fraction.nft.name}</CardTitle>
                    <p className="text-xs text-[var(--wine-muted)]">{fraction.nft.cantina.name}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {fraction.nft.collection.vintage && (
                        <Badge variant="outline" className="text-xs">{fraction.nft.collection.vintage}</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--wine-muted)]">
                          {fraction.listedPercentage !== null ? "Quota in vendita:" : "Quota:"}
                        </span>
                        <span className="font-bold text-amber-600">
                          {(fraction.listedPercentage !== null
                            ? Number(fraction.listedPercentage)
                            : Number(fraction.percentage)
                          ).toFixed(2)}%
                          {fraction.listedPercentage !== null && (
                            <span className="text-xs text-blue-500 ml-1">(parziale)</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--wine-muted)]">Venditore:</span>
                        <span className="text-white/80">{fraction.owner.name || fraction.owner.email}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <BuyFractionButton
                        fractionId={fraction.id}
                        askingPrice={Number(fraction.askingPrice)}
                        listedPercentage={fraction.listedPercentage !== null ? Number(fraction.listedPercentage) : null}
                        totalPercentage={Number(fraction.percentage)}
                        isLoggedIn={!!session}
                        needsTermsAcceptance={!!session && needsTermsAcceptance}
                        kycComplete={!session || kycComplete}
                      />
                      <MakeOfferButton
                        fractionId={fraction.id}
                        listedPrice={Number(fraction.askingPrice)}
                        isLoggedIn={!!session}
                        currentUserId={session?.user.id}
                        sellerId={fraction.owner.id}
                        kycComplete={!session || kycComplete}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* AdSense — between sections */}
        {(fractionableNfts.length > 0 || availableFractions.length > 0) && (
          <div className="mb-10">
            <AdSenseBanner slot="marketplace-mid" format="horizontal" className="w-full" />
          </div>
        )}

        {/* Regular NFTs */}
        {nfts.length === 0 && fractionableNfts.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <p className="text-lg">Nessun NFT disponibile al momento</p>
          </div>
        ) : nfts.length > 0 ? (
          <>
            {fractionableNfts.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Wine className="w-5 h-5 text-[#df071b]" />
                <h2 className="text-xl font-bold text-white">Acquista una bottiglia</h2>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {nfts.map((nft) => (
                <Card key={nft.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <Link href={`/${lang}/nft/${nft.id}`} className="block">
                    <div className="relative">
                      <NftImageGallery
                        images={nft.imageGallery ?? []}
                        fallbackUrl={nft.imageUrl ?? undefined}
                        alt={nft.name}
                        className="h-48"
                      />
                      {session && (
                        <div className="absolute top-2 left-2 z-10">
                          <FavoriteButton nftId={nft.id} initialFavorited={userFavoriteIds.has(nft.id)} />
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-sm font-semibold leading-tight">
                      <Link href={`/${lang}/nft/${nft.id}`} className="hover:text-amber-400 transition-colors">
                        {nft.name}
                      </Link>
                    </CardTitle>
                    <p className="text-xs text-[var(--wine-muted)]">
                      {nft.cantina.name}{" "}
                      <Link href={`/${lang}/cantine/${nft.cantina.id}`} className="text-amber-600 hover:underline">
                        Vedi cantina
                      </Link>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {nft.collection.vintage && <Badge variant="outline" className="text-xs">{nft.collection.vintage}</Badge>}
                      {nft.collection.grape && <Badge variant="secondary" className="text-xs">{nft.collection.grape}</Badge>}
                      {nft.denomination && (
                        <Badge className={`text-xs ${nft.denomination.type === "DOCG" ? "bg-red-700" : nft.denomination.type === "DOC" ? "bg-orange-600" : "bg-gray-600"} text-white`}>
                          {nft.denomination.type}
                        </Badge>
                      )}
                    </div>
                    {nft.denomination && (
                      <p className="text-xs text-white/50">{nft.denomination.name} · {nft.denomination.region}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">€ {nft.price?.toFixed(2)}</span>
                      <span className="text-xs text-white/40">Bottiglia #{nft.bottleNumber}</span>
                    </div>
                    {session?.user.id !== nft.owner.id ? (
                      <div className="space-y-2">
                        <BuyButton
                          nftId={nft.id}
                          price={nft.price!}
                          nftName={nft.name}
                          isLoggedIn={!!session}
                          needsTermsAcceptance={!!session && needsTermsAcceptance}
                          kycComplete={!session || kycComplete}
                        />
                        <MakeOfferButton
                          nftId={nft.id}
                          listedPrice={nft.price!}
                          isLoggedIn={!!session}
                          currentUserId={session?.user.id}
                          sellerId={nft.owner.id}
                          kycComplete={!session || kycComplete}
                        />
                      </div>
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
