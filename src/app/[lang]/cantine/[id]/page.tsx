import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NftImageGallery } from "@/components/shared/nft-image-gallery";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Globe, Wine } from "lucide-react";

export default async function CantinaPublicPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;

  const cantina = await db.cantina.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      location: true,
      website: true,
      logoUrl: true,
      isVerified: true,
      nfts: {
        where: { isListed: true, status: "LISTED" },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          imageGallery: true,
          price: true,
          bottleNumber: true,
          collection: {
            select: { name: true, vintage: true, grape: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!cantina) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
        {cantina.logoUrl ? (
          <Image
            src={cantina.logoUrl}
            alt={cantina.name}
            width={96}
            height={96}
            className="w-24 h-24 rounded-xl object-contain bg-white border border-stone-200 shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Wine className="w-10 h-10 text-amber-500" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold text-stone-900">{cantina.name}</h1>
            {cantina.isVerified && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verificata</Badge>
            )}
          </div>
          {cantina.description && (
            <p className="text-stone-600 mt-2 max-w-2xl">{cantina.description}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-stone-500">
            {cantina.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {cantina.location}
              </span>
            )}
            {cantina.website && (
              <a
                href={cantina.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-amber-600 hover:underline"
              >
                <Globe className="w-4 h-4" />
                {cantina.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* NFT gallery */}
      <h2 className="text-xl font-bold text-stone-900 mb-5 flex items-center gap-2">
        <Wine className="w-5 h-5 text-amber-600" />
        NFT disponibili ({cantina.nfts.length})
      </h2>

      {cantina.nfts.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <Wine className="w-12 h-12 mx-auto mb-4 text-stone-300" />
          <p>Nessun NFT disponibile al momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cantina.nfts.map((nft) => (
            <Link key={nft.id} href={`/${lang}/marketplace`} className="block group">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                <NftImageGallery
                  images={nft.imageGallery ?? []}
                  fallbackUrl={nft.imageUrl ?? undefined}
                  alt={nft.name}
                  className="h-48"
                />
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-semibold leading-tight group-hover:text-amber-700 transition-colors">
                    {nft.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {nft.collection.vintage && (
                      <Badge variant="outline" className="text-xs">{nft.collection.vintage}</Badge>
                    )}
                    {nft.collection.grape && (
                      <Badge variant="secondary" className="text-xs">{nft.collection.grape}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {nft.price && (
                      <span className="text-base font-bold text-stone-900">€ {nft.price.toFixed(2)}</span>
                    )}
                    <span className="text-xs text-stone-400">#{nft.bottleNumber}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
