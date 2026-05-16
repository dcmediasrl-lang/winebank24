export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferActions } from "@/components/collector/offer-actions";
import { Tag, Inbox, Send } from "lucide-react";
import { db } from "@/lib/db";

type OfferStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: { label: "In attesa", className: "bg-amber-100 text-amber-800" },
    ACCEPTED: { label: "Accettata", className: "bg-green-100 text-green-800" },
    REJECTED: { label: "Rifiutata", className: "bg-red-100 text-red-800" },
    WITHDRAWN: { label: "Ritirata", className: "bg-stone-100 text-stone-600" },
  };
  const { label, className } = map[status] ?? map.PENDING;
  return <Badge className={className}>{label}</Badge>;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function OffertePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  await params;
  const session = await auth();
  if (!session) redirect("/login");

  const [received, sent] = await Promise.all([
    db.offer.findMany({
      where: { sellerId: session.user.id },
      include: {
        nft: { select: { id: true, name: true, price: true } },
        fraction: {
          select: {
            id: true,
            askingPrice: true,
            nft: { select: { name: true } },
          },
        },
        buyer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.offer.findMany({
      where: { buyerId: session.user.id },
      include: {
        nft: { select: { id: true, name: true, price: true } },
        fraction: {
          select: {
            id: true,
            askingPrice: true,
            nft: { select: { name: true } },
          },
        },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pendingReceived = received.filter((o) => o.status === "PENDING");
  const pastReceived = received.filter((o) => o.status !== "PENDING");
  const pendingSent = sent.filter((o) => o.status === "PENDING");
  const pastSent = sent.filter((o) => o.status !== "PENDING");

  function getItemName(nft: { name: string } | null, fraction: { nft: { name: string } } | null) {
    if (nft) return nft.name;
    if (fraction) return `${fraction.nft.name} (quota)`;
    return "Articolo sconosciuto";
  }

  function getListedPrice(nft: { price?: number | null } | null, fraction: { askingPrice?: unknown } | null): number {
    if (nft) return nft.price ?? 0;
    if (fraction) return Number(fraction.askingPrice ?? 0);
    return 0;
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <Tag className="w-6 h-6 text-amber-600" />
        <h1 className="text-2xl font-bold text-stone-900">Offerte</h1>
      </div>

      {/* OFFERTE RICEVUTE */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="w-5 h-5 text-stone-600" />
          <h2 className="text-xl font-semibold text-stone-800">Offerte ricevute</h2>
          {pendingReceived.length > 0 && (
            <Badge className="bg-amber-500 text-stone-950 text-xs">
              {pendingReceived.length}
            </Badge>
          )}
        </div>

        {pendingReceived.length === 0 && pastReceived.length === 0 ? (
          <div className="text-center py-12 text-stone-400 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-base">Nessuna offerta ricevuta</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReceived.map((offer) => {
              const price = getListedPrice(offer.nft, offer.fraction);
              const pct = price > 0 ? ((offer.amount / price) * 100).toFixed(1) : "—";
              return (
                <Card key={offer.id} className="border-amber-200">
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-semibold">
                        {getItemName(offer.nft, offer.fraction)}
                      </CardTitle>
                      {statusBadge(offer.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2 bg-stone-50 rounded-md p-3">
                      <div>
                        <span className="text-stone-500 text-xs">Da:</span>
                        <p className="font-medium">
                          {offer.buyer?.name || offer.buyer?.email || "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-stone-500 text-xs">Offerta:</span>
                        <p className="font-bold text-green-700">€ {offer.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-stone-500 text-xs">Prezzo richiesto:</span>
                        <p className="font-medium">€ {price.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-stone-500 text-xs">% del prezzo:</span>
                        <p className="font-medium">{pct}%</p>
                      </div>
                    </div>
                    {offer.message && (
                      <p className="text-stone-600 italic text-xs bg-stone-50 rounded p-2">
                        &ldquo;{offer.message}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-stone-400">{formatDate(offer.createdAt)}</p>
                    <OfferActions offerId={offer.id} mode="seller" />
                  </CardContent>
                </Card>
              );
            })}

            {pastReceived.map((offer) => {
              const price = getListedPrice(offer.nft, offer.fraction);
              return (
                <Card key={offer.id} className="opacity-60 border-stone-200">
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-semibold">
                        {getItemName(offer.nft, offer.fraction)}
                      </CardTitle>
                      {statusBadge(offer.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-stone-500 space-y-1">
                    <p>
                      Da: {offer.buyer?.name || offer.buyer?.email || "—"} &middot;{" "}
                      <span className="font-medium">€ {offer.amount.toFixed(2)}</span>
                      {price > 0 && (
                        <span className="ml-1 text-xs">
                          ({((offer.amount / price) * 100).toFixed(1)}% di € {price.toFixed(2)})
                        </span>
                      )}
                    </p>
                    <p className="text-xs">{formatDate(offer.createdAt)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* OFFERTE INVIATE */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Send className="w-5 h-5 text-stone-600" />
          <h2 className="text-xl font-semibold text-stone-800">Offerte inviate</h2>
          {pendingSent.length > 0 && (
            <Badge className="bg-amber-500 text-stone-950 text-xs">
              {pendingSent.length}
            </Badge>
          )}
        </div>

        {pendingSent.length === 0 && pastSent.length === 0 ? (
          <div className="text-center py-12 text-stone-400 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-base">Nessuna offerta inviata</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSent.map((offer) => {
              const price = getListedPrice(offer.nft, offer.fraction);
              return (
                <Card key={offer.id} className="border-blue-100">
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-semibold">
                        {getItemName(offer.nft, offer.fraction)}
                      </CardTitle>
                      {statusBadge(offer.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2 bg-stone-50 rounded-md p-3">
                      <div>
                        <span className="text-stone-500 text-xs">Venditore:</span>
                        <p className="font-medium">
                          {offer.seller?.name || offer.seller?.email || "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-stone-500 text-xs">La tua offerta:</span>
                        <p className="font-bold text-amber-700">€ {offer.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-stone-500 text-xs">Prezzo richiesto:</span>
                        <p className="font-medium">€ {price.toFixed(2)}</p>
                      </div>
                    </div>
                    {offer.message && (
                      <p className="text-stone-600 italic text-xs bg-stone-50 rounded p-2">
                        &ldquo;{offer.message}&rdquo;
                      </p>
                    )}
                    <p className="text-xs text-stone-400">{formatDate(offer.createdAt)}</p>
                    <OfferActions offerId={offer.id} mode="buyer" />
                  </CardContent>
                </Card>
              );
            })}

            {pastSent.map((offer) => {
              const price = getListedPrice(offer.nft, offer.fraction);
              return (
                <Card key={offer.id} className="opacity-60 border-stone-200">
                  <CardHeader className="pb-2 pt-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-semibold">
                        {getItemName(offer.nft, offer.fraction)}
                      </CardTitle>
                      {statusBadge(offer.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-stone-500 space-y-1">
                    <p>
                      A: {offer.seller?.name || offer.seller?.email || "—"} &middot;{" "}
                      <span className="font-medium">€ {offer.amount.toFixed(2)}</span>
                      {price > 0 && (
                        <span className="ml-1 text-xs">di € {price.toFixed(2)}</span>
                      )}
                    </p>
                    <p className="text-xs">{formatDate(offer.createdAt)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
