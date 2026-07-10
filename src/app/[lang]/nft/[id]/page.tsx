import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BuyButton } from "@/components/collector/buy-button";
import { InvestFractionDialog } from "@/components/collector/invest-fraction-dialog";
import { MakeOfferButton } from "@/components/collector/make-offer-button";
import { FavoriteButton } from "@/components/collector/favorite-button";
import { DeliveryRequestButton } from "@/components/collector/delivery-request-button";
import { ListNftButton } from "@/components/collector/list-nft-button";
import { NftImageGallery } from "@/components/shared/nft-image-gallery";
import Link from "next/link";
import Image from "next/image";
import {
  Wine,
  MapPin,
  Globe,
  ChevronRight,
  Hash,
  Calendar,
  Grape,
  Award,
  ExternalLink,
  ShieldCheck,
  Package,
  BookOpen,
  Warehouse,
  Tag,
  Archive,
} from "lucide-react";

export default async function NftDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const session = await auth();

  const nft = await db.nft.findUnique({
    where: { id },
    include: {
      cantina: {
        select: {
          id: true,
          name: true,
          description: true,
          location: true,
          website: true,
          logoUrl: true,
          isVerified: true,
          userId: true,
        },
      },
      collection: {
        select: { id: true, name: true, vintage: true, grape: true },
      },
      owner: { select: { id: true, name: true } },
      denomination: {
        select: { id: true, name: true, type: true, region: true },
      },
      burnRequest: { select: { id: true } },
    },
  });

  if (!nft) notFound();

  // Platform config (fees)
  const platformConfig = await db.platformConfig.findFirst();
  const platformFeePct = platformConfig?.platformFeePct ?? 3.0;

  // Is secondary sale (owner ≠ cantina's user)?
  const isSecondarySale = nft.ownerId !== nft.cantina.userId;
  const cantinaRoyaltyPct = isSecondarySale ? nft.royaltyPct : 0;

  // User state checks
  let needsTermsAcceptance = false;
  let kycComplete = false;
  let isFavorited = false;

  if (session?.user?.id) {
    const [user, fav] = await Promise.all([
      db.user.findUnique({
        where: { id: session.user.id },
        select: {
          buyerContractAcceptedAt: true,
          firstName: true,
          lastName: true,
          birthDate: true,
          country: true,
          fiscalCode: true,
        },
      }).catch(() => null),
      db.favoriteNft
        .findUnique({
          where: { userId_nftId: { userId: session.user.id, nftId: id } },
        })
        .catch(() => null),
    ]);
    needsTermsAcceptance = !user?.buyerContractAcceptedAt;
    kycComplete = !!(
      user?.firstName &&
      user?.lastName &&
      user?.birthDate &&
      user?.country &&
      user?.fiscalCode
    );
    isFavorited = !!fav;
  }

  const isOwner = session?.user?.id === nft.owner.id;
  const totalValue = Number(nft.totalValue ?? 0);
  const availableValue = Number(nft.availableValue ?? 0);
  const soldPct =
    totalValue > 0 ? ((totalValue - availableValue) / totalValue) * 100 : 0;

  const denominationColor =
    nft.denomination?.type === "DOCG"
      ? "bg-red-700 text-white"
      : nft.denomination?.type === "DOC"
      ? "bg-orange-600 text-white"
      : "bg-stone-600 text-white";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" style={{ color: "white" }}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-white/40 mb-6">
        <Link href={`/${lang}`} className="hover:text-white transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3" />
        <Link
          href={`/${lang}/marketplace`}
          className="hover:text-white transition-colors"
        >
          Marketplace
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white/70 truncate max-w-[200px]">{nft.name}</span>
      </nav>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Left — image gallery */}
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-[var(--wine-border)] bg-[#1a0f0f]">
            <NftImageGallery
              images={nft.imageGallery ?? []}
              fallbackUrl={nft.imageUrl ?? undefined}
              alt={nft.name}
              className="aspect-square w-full"
            />
            {/* Status badge overlay */}
            {nft.status !== "LISTED" && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge className="text-base px-4 py-2 bg-white/10 border border-white/30 text-white">
                  {nft.status === "MINTED"
                    ? "Non in vendita"
                    : nft.status === "SOLD"
                    ? "Venduto"
                    : nft.status}
                </Badge>
              </div>
            )}
            {/* Favorite button */}
            {session && (
              <div className="absolute top-3 left-3 z-10">
                <FavoriteButton nftId={nft.id} initialFavorited={isFavorited} />
              </div>
            )}
          </div>

          {/* Blockchain info */}
          {(nft.tokenId || nft.txHash || nft.contractAddress) && (
            <div className="rounded-xl border border-[var(--wine-border)] bg-[#1a0f0f] p-4 space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Certificazione Blockchain
              </p>
              {nft.tokenId && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Token ID</span>
                  <span className="font-mono text-amber-400">#{nft.tokenId}</span>
                </div>
              )}
              {nft.contractAddress && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Contratto</span>
                  <span className="font-mono text-white/70 truncate max-w-[180px]">
                    {nft.contractAddress.slice(0, 10)}…{nft.contractAddress.slice(-6)}
                  </span>
                </div>
              )}
              {nft.txHash && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">TX Hash</span>
                  <a
                    href={`https://polygonscan.com/tx/${nft.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-amber-400 hover:underline flex items-center gap-1"
                  >
                    {nft.txHash.slice(0, 8)}…
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right — details + actions */}
        <div className="flex flex-col gap-5">
          {/* Title + badges */}
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {nft.isFractionable && (
                <Badge className="bg-amber-600/20 text-amber-400 border border-amber-600/30 text-xs">
                  Co-proprietà
                </Badge>
              )}
              {nft.denomination && (
                <Badge className={`text-xs ${denominationColor}`}>
                  {nft.denomination.type}
                </Badge>
              )}
              {nft.status === "LISTED" && !nft.isFractionable && (
                <Badge className="bg-green-900/40 text-green-400 border border-green-700/40 text-xs">
                  In vendita
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              {nft.name}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Bottiglia #{nft.bottleNumber} · {nft.collection.name}
            </p>
          </div>

          {/* Wine details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nft.collection.vintage && (
              <div className="bg-[#1a0f0f] rounded-xl border border-[var(--wine-border)] px-4 py-3">
                <p className="text-xs text-white/40 flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3" /> Annata
                </p>
                <p className="font-bold text-white">{nft.collection.vintage}</p>
              </div>
            )}
            {nft.collection.grape && (
              <div className="bg-[#1a0f0f] rounded-xl border border-[var(--wine-border)] px-4 py-3">
                <p className="text-xs text-white/40 flex items-center gap-1 mb-1">
                  <Grape className="w-3 h-3" /> Vitigno
                </p>
                <p className="font-bold text-white">{nft.collection.grape}</p>
              </div>
            )}
            {nft.denomination && (
              <div className="bg-[#1a0f0f] rounded-xl border border-[var(--wine-border)] px-4 py-3">
                <p className="text-xs text-white/40 flex items-center gap-1 mb-1">
                  <Award className="w-3 h-3" /> Denominazione
                </p>
                <p className="font-bold text-white text-sm">{nft.denomination.name}</p>
              </div>
            )}
            {nft.denomination?.region && (
              <div className="bg-[#1a0f0f] rounded-xl border border-[var(--wine-border)] px-4 py-3">
                <p className="text-xs text-white/40 flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3" /> Regione
                </p>
                <p className="font-bold text-white">{nft.denomination.region}</p>
              </div>
            )}
            {nft.bottleFormat && (
              <div className="bg-[#1a0f0f] rounded-xl border border-[var(--wine-border)] px-4 py-3">
                <p className="text-xs text-white/40 flex items-center gap-1 mb-1">
                  <Package className="w-3 h-3" /> Formato
                </p>
                <p className="font-bold text-white">{nft.bottleFormat}</p>
              </div>
            )}
            {nft.currentLocation && (
              <div className="bg-[#1a0f0f] rounded-xl border border-[var(--wine-border)] px-4 py-3 col-span-2">
                <p className="text-xs text-white/40 flex items-center gap-1 mb-1">
                  <Warehouse className="w-3 h-3" /> Collocazione attuale
                </p>
                <p className="font-bold text-white text-sm">{nft.currentLocation}</p>
              </div>
            )}
          </div>

          {/* Price / value */}
          {nft.isListed && nft.status === "LISTED" && (
            <div className="bg-[#1a0f0f] rounded-xl border border-[var(--wine-border)] px-5 py-4">
              {nft.isFractionable ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-white/50 text-sm">Valore totale</span>
                    <span className="text-2xl font-bold text-white">
                      € {totalValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-white/50">
                      <span>Disponibile: € {availableValue.toFixed(2)}</span>
                      <span>{soldPct.toFixed(1)}% venduto</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(soldPct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline justify-between">
                  <span className="text-white/50 text-sm">Prezzo</span>
                  <span className="text-3xl font-bold text-white">
                    € {nft.price?.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {isOwner ? (
              <div className="rounded-xl border border-white/15 bg-[#1a0f0f] p-4 space-y-4">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Questo è il tuo certificato</p>

                {/* Metti in vendita */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Tag className="w-4 h-4 text-amber-400" /> Metti in vendita
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Pubblica il certificato sul marketplace. I collezionisti potranno acquistarlo al prezzo che imposti.
                    La royalty del {nft.royaltyPct}% andrà automaticamente alla cantina ad ogni rivendita.
                  </p>
                  <ListNftButton nftId={nft.id} isListed={nft.isListed} price={nft.price} />
                </div>

                {/* Tieni in collezione */}
                <div className="pt-1 border-t border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Archive className="w-4 h-4 text-green-400" /> Tieni in collezione
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    La bottiglia resta custodita presso {nft.cantina.name} nelle condizioni ottimali di conservazione.
                    Puoi metterla in vendita in qualsiasi momento.
                  </p>
                </div>

                {/* Ritira bottiglia fisica */}
                <div className="pt-1 border-t border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Package className="w-4 h-4 text-orange-400" /> Ritira la bottiglia fisica
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">
                    Richiedi la consegna fisica della bottiglia. Il certificato digitale verrà distrutto (burn)
                    e riceverai la bottiglia al tuo indirizzo. Disponibile solo se abilitato dalla cantina.
                  </p>
                  <DeliveryRequestButton
                    nftId={nft.id}
                    nftName={nft.name}
                    bottleValue={nft.price ?? Number(nft.totalValue ?? 0)}
                    physicalDeliveryUnlocked={nft.physicalDeliveryUnlocked}
                    shippingCost={nft.shippingCost}
                    alreadyRequested={!!nft.burnRequest}
                  />
                </div>
              </div>
            ) : nft.isListed && nft.status === "LISTED" ? (
              nft.isFractionable ? (
                <>
                  <InvestFractionDialog
                    nftId={nft.id}
                    nftName={nft.name}
                    totalValue={totalValue}
                    availableValue={availableValue}
                    isLoggedIn={!!session}
                    needsTermsAcceptance={!!session && needsTermsAcceptance}
                    kycComplete={!session || kycComplete}
                  />
                  {availableValue > 0 && (
                    <MakeOfferButton
                      nftId={nft.id}
                      listedPrice={totalValue}
                      isLoggedIn={!!session}
                      currentUserId={session?.user.id}
                      sellerId={nft.owner.id}
                      kycComplete={!session || kycComplete}
                    />
                  )}
                </>
              ) : (
                <>
                  <BuyButton
                    nftId={nft.id}
                    price={nft.price!}
                    nftName={nft.name}
                    isLoggedIn={!!session}
                    needsTermsAcceptance={!!session && needsTermsAcceptance}
                    kycComplete={!session || kycComplete}
                    platformFeePct={platformFeePct}
                    isSecondarySale={isSecondarySale}
                    cantinaRoyaltyPct={cantinaRoyaltyPct}
                  />
                  <MakeOfferButton
                    nftId={nft.id}
                    listedPrice={nft.price!}
                    isLoggedIn={!!session}
                    currentUserId={session?.user.id}
                    sellerId={nft.owner.id}
                    kycComplete={!session || kycComplete}
                  />
                </>
              )
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/60">
                {nft.status === "SOLD"
                  ? "Questa bottiglia è già stata venduta"
                  : "Non disponibile per la vendita al momento"}
              </div>
            )}
          </div>

          {/* Cantina card */}
          <div className="mt-auto">
            <p className="text-xs text-white/40 uppercase tracking-wide mb-2 font-semibold">
              Cantina produttrice
            </p>
            <Link
              href={`/${lang}/cantine/${nft.cantina.id}`}
              className="flex items-center gap-3 bg-[#1a0f0f] rounded-xl border border-[var(--wine-border)] px-4 py-3 hover:border-amber-600/40 transition-colors group"
            >
              {nft.cantina.logoUrl ? (
                <Image
                  src={nft.cantina.logoUrl}
                  alt={nft.cantina.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg object-contain bg-[#231515]"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[#231515] flex items-center justify-center shrink-0">
                  <Wine className="w-5 h-5 text-amber-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-white text-sm group-hover:text-amber-400 transition-colors truncate">
                    {nft.cantina.name}
                  </p>
                  {nft.cantina.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  )}
                </div>
                {nft.cantina.location && (
                  <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {nft.cantina.location}
                  </p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* Storia della bottiglia */}
      {nft.bottleStory && (
        <section className="mb-6 bg-[#1a0f0f] rounded-2xl border border-[var(--wine-border)] p-6">
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500" />
            Storia della bottiglia
          </h2>
          <p className="text-white/70 leading-relaxed text-sm whitespace-pre-wrap">
            {nft.bottleStory}
          </p>
        </section>
      )}

      {/* Description */}
      {nft.description && (
        <section className="mb-8 bg-[#1a0f0f] rounded-2xl border border-[var(--wine-border)] p-6">
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4 text-amber-500" />
            Note di produzione
          </h2>
          <p className="text-white/70 leading-relaxed text-sm whitespace-pre-wrap">
            {nft.description}
          </p>
        </section>
      )}

      {/* Back to marketplace */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href={`/${lang}/marketplace`}
          className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1.5"
        >
          ← Torna al Marketplace
        </Link>
        {nft.cantina.website && (
          <a
            href={nft.cantina.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-amber-500 hover:underline flex items-center gap-1.5"
          >
            <Globe className="w-4 h-4" />
            Sito della cantina
          </a>
        )}
      </div>
    </div>
  );
}
