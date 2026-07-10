import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateNftStandalone } from "@/components/cantina/create-nft-standalone";
import { ListCantinaNftButton } from "@/components/cantina/list-cantina-nft-button";
import { UnlockDeliveryButton } from "@/components/cantina/unlock-delivery-button";
import { Wine, ExternalLink } from "lucide-react";
import Link from "next/link";

const STATUS_COLOR: Record<string, string> = {
  PENDING_PAYMENT:     "bg-yellow-900/40 text-yellow-400",
  MINTED:              "bg-white/10 text-white/60",
  LISTED:              "bg-green-900/40 text-green-400",
  SOLD:                "bg-blue-900/40 text-blue-400",
  BURN_REQUESTED:      "bg-orange-900/40 text-orange-400",
  BURNED:              "bg-red-900/40 text-red-400",
  LIQUIDATION_REQUESTED: "bg-yellow-900/40 text-yellow-400",
  LIQUIDATED:          "bg-gray-900/40 text-gray-400",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT:     "Att. pagamento fee",
  MINTED:              "In cantina",
  LISTED:              "In vendita",
  SOLD:                "Ceduto",
  BURN_REQUESTED:      "Ritiro richiesto",
  BURNED:              "Consegnato",
  LIQUIDATION_REQUESTED: "Liquidazione richiesta",
  LIQUIDATED:          "Liquidato",
};

export default async function CantinaNftsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const session = await auth();

  const cantina = await db.cantina.findUnique({
    where: { userId: session!.user.id },
  });

  if (!cantina) {
    return (
      <div className="text-center py-20 text-white/40">
        <p>Profilo cantina non trovato. Contatta l&apos;amministratore.</p>
      </div>
    );
  }

  const nfts = await db.nft.findMany({
    where: { cantinaId: cantina.id },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
      burnRequest: { select: { id: true, approved: true, address: true } },
      fractions: { select: { id: true } },
    },
  });

  const STATUS_LABEL_EXTRA: Record<string, string> = {
    PENDING_PAYMENT: "In attesa pagamento",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">I miei certificati</h1>
          <p className="text-[var(--wine-muted)] text-sm mt-1">{nfts.length} certificati emessi</p>
        </div>
        <CreateNftStandalone cantinaId={cantina.id} />
      </div>

      {nfts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="w-16 h-16 bg-[#231515] rounded-full flex items-center justify-center">
            <Wine className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white/80">Nessun certificato ancora</p>
            <p className="text-sm text-white/40 mt-1">
              Crea il primo certificato digitale per una delle tue bottiglie.
            </p>
          </div>
          <CreateNftStandalone cantinaId={cantina.id} />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tutti i certificati emessi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-[var(--wine-muted)] text-left">
                    <th className="pb-3 pr-4">Bottiglia</th>
                    <th className="pb-3 pr-4">Annata</th>
                    <th className="pb-3 pr-4">N°</th>
                    <th className="pb-3 pr-4">Proprietario</th>
                    <th className="pb-3 pr-4">Prezzo / Valore</th>
                    <th className="pb-3 pr-4">Stato</th>
                    <th className="pb-3 pr-4">Data</th>
                    <th className="pb-3">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {nfts.map((nft) => (
                    <tr key={nft.id} className="hover:bg-[var(--wine-card-hover)]">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {nft.imageUrl ? (
                            <img src={nft.imageUrl} alt={nft.name} className="w-10 h-10 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-[#231515] flex items-center justify-center shrink-0">
                              <Wine className="w-5 h-5 text-amber-400" />
                            </div>
                          )}
                          <div>
                            <Link href={`/${lang}/nft/${nft.id}`} className="font-medium text-white hover:text-amber-400 transition-colors">
                              {nft.name}
                            </Link>
                            {nft.isFractionable && (
                              <span className="block text-xs text-blue-400 font-medium">
                                Co-proprietà · {nft.fractions.length} quote
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-[var(--wine-muted)]">{nft.vintage ?? "—"}</td>
                      <td className="py-3 pr-4 text-[var(--wine-muted)] font-mono text-xs">#{nft.bottleNumber}</td>
                      <td className="py-3 pr-4 text-[var(--wine-muted)] text-xs">
                        {nft.owner.name || nft.owner.email}
                        {nft.burnRequest && !nft.burnRequest.approved && (
                          <span className="block text-orange-500 mt-0.5">
                            → {nft.burnRequest.address.split(",")[0]}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-medium text-white">
                        {nft.isFractionable
                          ? `€ ${Number(nft.totalValue ?? 0).toFixed(2)}`
                          : nft.price
                            ? `€ ${nft.price.toFixed(2)}`
                            : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[nft.status] ?? "bg-white/10 text-white/60"}`}>
                          {STATUS_LABEL[nft.status] ?? nft.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-white/40 text-xs">
                        {new Date(nft.createdAt).toLocaleDateString("it-IT")}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(nft.status === "MINTED" || nft.status === "LISTED") && !nft.isFractionable && (
                            <ListCantinaNftButton
                              nftId={nft.id}
                              isListed={nft.isListed}
                              price={nft.price}
                            />
                          )}
                          {nft.status !== "PENDING_PAYMENT" && nft.status !== "BURNED" && nft.status !== "LIQUIDATED" && !nft.isFractionable && (
                            <UnlockDeliveryButton
                              nftId={nft.id}
                              currentlyUnlocked={nft.physicalDeliveryUnlocked}
                              currentShippingCost={nft.shippingCost}
                            />
                          )}
                          <Link
                            href={`/${lang}/nft/${nft.id}`}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-white/20 text-white/60 hover:border-amber-500 hover:text-amber-400 transition-colors"
                            title="Vedi scheda prodotto"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Scheda
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
