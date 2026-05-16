import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MintNftDialog } from "@/components/cantina/mint-nft-dialog";
import { ListCantinaNftButton } from "@/components/cantina/list-cantina-nft-button";
import { Wine } from "lucide-react";

export default async function CantinaNftsPage() {
  const session = await auth();

  const cantina = await db.cantina.findUnique({
    where: { userId: session!.user.id },
  });

  if (!cantina) {
    return (
      <div className="text-center py-20 text-stone-400">
        <p>Profilo cantina non trovato.</p>
      </div>
    );
  }

  const [nfts, collections] = await Promise.all([
    db.nft.findMany({
      where: { cantinaId: cantina.id },
      orderBy: { createdAt: "desc" },
      include: {
        collection: { select: { name: true, vintage: true } },
        owner: { select: { name: true, email: true } },
        burnRequest: { select: { id: true, approved: true, address: true } },
      },
    }),
    db.collection.findMany({
      where: { cantinaId: cantina.id },
      select: { id: true, name: true, totalSupply: true, minted: true },
    }),
  ]);

  const statusColor: Record<string, string> = {
    MINTED:        "bg-stone-100 text-stone-700",
    LISTED:        "bg-green-100 text-green-700",
    SOLD:          "bg-blue-100 text-blue-700",
    BURN_REQUESTED:"bg-orange-100 text-orange-700",
    BURNED:        "bg-red-100 text-red-700",
  };

  const statusLabel: Record<string, string> = {
    MINTED:        "In collezione",
    LISTED:        "In vendita",
    SOLD:          "Venduto",
    BURN_REQUESTED:"Bottiglia richiesta",
    BURNED:        "Bruciato",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">I miei NFT</h1>
        <span className="text-sm text-stone-400">{nfts.length} NFT totali</span>
      </div>

      {nfts.length === 0 ? (
        <div className="text-center py-20 text-stone-400 space-y-2">
          <Wine className="w-12 h-12 mx-auto text-stone-300" />
          <p className="text-lg">Nessun NFT ancora mintato</p>
          <p className="text-sm">Vai in <strong>Collezioni</strong> per iniziare a mintare</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tutti gli NFT della cantina</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-stone-500 text-left">
                    <th className="pb-3 pr-4">NFT</th>
                    <th className="pb-3 pr-4">Collezione</th>
                    <th className="pb-3 pr-4">Bottiglia</th>
                    <th className="pb-3 pr-4">Proprietario attuale</th>
                    <th className="pb-3 pr-4">Prezzo</th>
                    <th className="pb-3 pr-4">Stato</th>
                    <th className="pb-3 pr-4">Token ID</th>
                    <th className="pb-3 pr-4">Data minting</th>
                    <th className="pb-3">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {nfts.map((nft) => (
                    <tr key={nft.id} className="hover:bg-stone-50">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {nft.imageUrl ? (
                            <img src={nft.imageUrl} alt={nft.name} className="w-10 h-10 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-stone-100 flex items-center justify-center shrink-0">
                              <Wine className="w-5 h-5 text-stone-400" />
                            </div>
                          )}
                          <span className="font-medium">{nft.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-stone-600">
                        {nft.collection.name}
                        {nft.collection.vintage && (
                          <span className="block text-xs text-stone-400">{nft.collection.vintage}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-stone-500">#{nft.bottleNumber}</td>
                      <td className="py-3 pr-4 text-stone-500 text-xs">
                        {nft.owner.name || nft.owner.email}
                        {nft.burnRequest && !nft.burnRequest.approved && (
                          <span className="block text-orange-500 mt-0.5">
                            Spedire a: {nft.burnRequest.address.split(",")[0]}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-medium">
                        {nft.price ? `€ ${nft.price.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[nft.status]}`}>
                          {statusLabel[nft.status]}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-stone-400 font-mono text-xs">
                        {nft.tokenId ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-stone-400 text-xs">
                        {new Date(nft.createdAt).toLocaleDateString("it-IT")}
                      </td>
                      <td className="py-3">
                        {(nft.status === "MINTED" || nft.status === "LISTED") && (
                          <ListCantinaNftButton
                            nftId={nft.id}
                            isListed={nft.isListed}
                            price={nft.price}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Riepilogo veloce per collezione */}
      {collections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riepilogo per collezione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {collections.map((col) => (
                <div key={col.id} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium">{col.name}</span>
                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <span>{col.minted} / {col.totalSupply} mintati</span>
                    <div className="w-32 bg-stone-200 rounded-full h-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{ width: `${(col.minted / col.totalSupply) * 100}%` }}
                      />
                    </div>
                    {col.minted < col.totalSupply && (
                      <MintNftDialog
                        collectionId={col.id}
                        cantinaId={cantina.id}
                        collectionName={col.name}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
