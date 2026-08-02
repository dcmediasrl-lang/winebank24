import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeliveryRequestButton } from "@/components/collector/delivery-request-button";
import { NftImageGallery } from "@/components/shared/nft-image-gallery";
import Link from "next/link";

// Collezione della cantina: gli NFT acquistati da altri utenti o cantine.
// La produzione propria resta in "I miei NFT".
export default async function CantinaCollezionePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const session = await auth();

  const cantina = await db.cantina.findUnique({
    where: { userId: session!.user.id },
    select: { id: true },
  });

  const [nfts, fractions] = await Promise.all([
    db.nft.findMany({
      where: {
        ownerId: session!.user.id,
        status: { not: "BURNED" },
        ...(cantina ? { cantinaId: { not: cantina.id } } : {}),
      },
      include: {
        collection: { select: { name: true } },
        cantina: { select: { name: true } },
        burnRequest: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.nftFraction.findMany({
      where: {
        ownerId: session!.user.id,
        ...(cantina ? { nft: { cantinaId: { not: cantina.id } } } : {}),
      },
      include: {
        nft: {
          include: { cantina: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Collezione</h1>
        <p className="text-sm text-[var(--wine-muted)] mb-6">
          Gli NFT che hai acquistato da altri utenti o cantine. La tua produzione è in &ldquo;I miei NFT&rdquo;.
        </p>
        {nfts.length === 0 && fractions.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <p className="text-lg mb-2">Nessun NFT acquistato da altre cantine</p>
            <p className="text-sm">
              Visita il <Link href={`/${lang}/marketplace`} className="text-[#df071b] hover:underline">Marketplace</Link> per acquistare NFT di altri produttori
            </p>
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
                  <CardTitle className="text-base">{nft.name}</CardTitle>
                  <p className="text-xs text-[var(--wine-muted)]">
                    {nft.cantina.name} · {nft.collection.name}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={nft.isListed ? "default" : "secondary"} className="text-xs">
                      {nft.isListed ? "In vendita" : "In collezione"}
                    </Badge>
                    {nft.price != null && (
                      <span className="font-semibold text-white">€ {nft.price.toFixed(2)}</span>
                    )}
                  </div>
                  <DeliveryRequestButton
                    nftId={nft.id}
                    nftName={nft.name}
                    bottleValue={nft.price ?? Number(nft.totalValue ?? 0)}
                    physicalDeliveryUnlocked={nft.physicalDeliveryUnlocked}
                    shippingCost={nft.shippingCost}
                    alreadyRequested={!!nft.burnRequest}
                    compact
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {fractions.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Quote di co-proprietà</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fractions.map((f) => (
              <Card key={f.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{f.nft.name}</CardTitle>
                  <p className="text-xs text-[var(--wine-muted)]">{f.nft.cantina.name}</p>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[var(--wine-muted)]">Quota:</span>
                    <span className="font-bold text-amber-700">{Number(f.percentage).toFixed(4)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--wine-muted)]">Valore acquisto:</span>
                    <span className="font-semibold text-white">€ {Number(f.investedAmount).toFixed(2)}</span>
                  </div>
                  <Link
                    href={`/${lang}/nft/${f.nftId}`}
                    className="inline-block pt-2 text-xs text-[#df071b] hover:underline"
                  >
                    Vedi certificato →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
