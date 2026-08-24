import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NftImageGallery } from "@/components/shared/nft-image-gallery";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Globe, Wine, FileText, Calendar } from "lucide-react";
import { isCantinaPubliclyVerified } from "@/lib/cantina";

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
      insuranceDocUrl: true,
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
      blogPosts: {
        where: { isPublished: true },
        select: {
          id: true, slug: true, titleIt: true, titleEn: true,
          excerptIt: true, excerptEn: true, category: true,
          coverImage: true, publishedAt: true, createdAt: true,
        },
        orderBy: { publishedAt: "desc" },
        take: 6,
      },
    },
  });

  if (!cantina) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10" style={{ color: "white" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6 mb-10">
        {cantina.logoUrl ? (
          <Image
            src={cantina.logoUrl}
            alt={cantina.name}
            width={96}
            height={96}
            className="w-24 h-24 rounded-xl object-contain bg-[var(--wine-card)] border border-[var(--wine-border)] shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-xl bg-[#231515] flex items-center justify-center shrink-0">
            <Wine className="w-10 h-10 text-amber-500" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold text-white">{cantina.name}</h1>
            {isCantinaPubliclyVerified(cantina) && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verificata</Badge>
            )}
          </div>
          {cantina.description && (
            <p className="text-white/70 mt-2 max-w-2xl">{cantina.description}</p>
          )}
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-[var(--wine-muted)]">
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

      {/* Galleria certificati */}
      <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
        <Wine className="w-5 h-5 text-amber-600" />
        Certificati disponibili ({cantina.nfts.length})
      </h2>

      {cantina.nfts.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <Wine className="w-12 h-12 mx-auto mb-4 text-white/20" />
          <p>Nessun certificato disponibile al momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {cantina.nfts.map((nft) => (
            <Link key={nft.id} href={`/${lang}/nft/${nft.id}`} className="block group">
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
                      <span className="text-base font-bold text-white">€ {nft.price.toFixed(2)}</span>
                    )}
                    <span className="text-xs text-white/40">#{nft.bottleNumber}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Blog posts from this cantina */}
      {cantina.blogPosts.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            Dal blog di {cantina.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cantina.blogPosts.map(post => {
              const title = lang === "en" ? (post.titleEn || post.titleIt) : post.titleIt;
              const excerpt = lang === "en" ? (post.excerptEn || post.excerptIt) : post.excerptIt;
              return (
                <Link key={post.id} href={`/${lang}/blog/${post.slug}`} className="block group">
                  <div className="bg-[#1a0f0f] rounded-xl border border-[var(--wine-border)] overflow-hidden hover:border-amber-600/30 transition-colors h-full flex flex-col">
                    {post.coverImage && (
                      <div className="h-40 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={post.coverImage}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-1">
                      {post.category && (
                        <Badge className="mb-2 text-xs w-fit bg-amber-900/30 text-amber-400 border-amber-700/30">
                          {post.category}
                        </Badge>
                      )}
                      <p className="font-semibold text-white text-sm leading-snug group-hover:text-amber-400 transition-colors">
                        {title}
                      </p>
                      {excerpt && (
                        <p className="text-xs text-white/50 mt-1.5 line-clamp-2">{excerpt}</p>
                      )}
                      <p className="text-xs text-white/25 mt-auto pt-3 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString("it-IT", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
