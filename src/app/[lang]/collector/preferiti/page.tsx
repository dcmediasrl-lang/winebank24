import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/collector/favorite-button";
import { NftImageGallery } from "@/components/shared/nft-image-gallery";
import { Heart } from "lucide-react";

export default async function PreferitePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/login`);

  const favorites = await db.favoriteNft.findMany({
    where: { userId: session.user.id },
    include: {
      nft: {
        include: {
          cantina: { select: { id: true, name: true } },
          collection: { select: { name: true, vintage: true, grape: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="w-7 h-7 text-red-500 fill-red-500" />
        <div>
          <h1 className="text-2xl font-bold text-white">Preferiti</h1>
          <p className="text-[var(--wine-muted)] text-sm mt-1">I tuoi NFT preferiti</p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Heart className="w-12 h-12 mx-auto mb-4 text-white/30" />
          <p className="text-lg">Non hai ancora aggiunto NFT ai preferiti</p>
          <p className="text-sm mt-2">Esplora il marketplace e clicca il cuore per salvare i tuoi preferiti</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favorites.map(({ nft }) => (
            <Card key={nft.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative">
                <NftImageGallery
                  images={nft.imageGallery ?? []}
                  fallbackUrl={nft.imageUrl ?? undefined}
                  alt={nft.name}
                  className="h-48"
                />
                <div className="absolute top-2 right-2 z-10">
                  <FavoriteButton nftId={nft.id} initialFavorited={true} />
                </div>
              </div>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-semibold leading-tight">{nft.name}</CardTitle>
                <p className="text-xs text-[var(--wine-muted)]">{nft.cantina.name}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {nft.collection.vintage && (
                    <Badge variant="outline" className="text-xs">{nft.collection.vintage}</Badge>
                  )}
                  {nft.collection.grape && (
                    <Badge variant="secondary" className="text-xs">{nft.collection.grape}</Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      nft.isListed ? "border-green-500 text-green-700" : "border-[var(--wine-border)] text-[var(--wine-muted)]"
                    }`}
                  >
                    {nft.isListed ? "In vendita" : nft.status}
                  </Badge>
                </div>
                {nft.price && (
                  <span className="text-lg font-bold text-white">€ {nft.price.toFixed(2)}</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
