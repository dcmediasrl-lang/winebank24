import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BurnApproveButton } from "@/components/admin/burn-approve-button";

export default async function AdminNftsPage() {
  const [nfts, burnRequests] = await Promise.all([
    db.nft.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        cantina: { select: { name: true } },
        collection: { select: { name: true } },
        owner: { select: { name: true, email: true } },
      },
    }),
    db.burnRequest.findMany({
      where: { approved: false },
      include: {
        nft: {
          include: {
            cantina: { select: { name: true } },
            owner: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-stone-900">NFT & Minting</h1>

      {/* Richieste burn in attesa */}
      {burnRequests.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-700">
              Richieste bottiglia fisica in attesa ({burnRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {burnRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-lg p-4 border border-red-100 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{req.nft.name}</p>
                    <p className="text-xs text-stone-500">Cantina: {req.nft.cantina.name}</p>
                    <p className="text-xs text-stone-500">Richiedente: {req.nft.owner.name} ({req.nft.owner.email})</p>
                    <p className="text-xs text-stone-700 font-medium">Spedizione: {req.address}</p>
                    {req.notes && <p className="text-xs text-stone-400">Note: {req.notes}</p>}
                    <p className="text-xs text-stone-400">{new Date(req.createdAt).toLocaleDateString("it-IT")}</p>
                  </div>
                  <BurnApproveButton burnRequestId={req.id} nftId={req.nft.id} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tutti gli NFT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tutti gli NFT ({nfts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-stone-500 text-left">
                  <th className="pb-3 pr-4">Nome NFT</th>
                  <th className="pb-3 pr-4">Cantina</th>
                  <th className="pb-3 pr-4">Proprietario</th>
                  <th className="pb-3 pr-4">Token ID</th>
                  <th className="pb-3 pr-4">Prezzo</th>
                  <th className="pb-3 pr-4">Stato</th>
                  <th className="pb-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {nfts.map((nft) => (
                  <tr key={nft.id}>
                    <td className="py-3 pr-4 font-medium">
                      {nft.name}
                      <span className="block text-xs text-stone-400">{nft.collection.name}</span>
                    </td>
                    <td className="py-3 pr-4 text-stone-600">{nft.cantina.name}</td>
                    <td className="py-3 pr-4 text-stone-600">
                      {nft.owner.name}
                      <span className="block text-xs text-stone-400">{nft.owner.email}</span>
                    </td>
                    <td className="py-3 pr-4 text-stone-400 font-mono text-xs">
                      {nft.tokenId ?? "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {nft.price ? `€ ${nft.price.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={
                        nft.status === "LISTED" ? "default" :
                        nft.status === "SOLD" ? "secondary" :
                        nft.status === "BURNED" ? "destructive" :
                        nft.status === "BURN_REQUESTED" ? "destructive" :
                        "outline"
                      }>
                        {nft.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-stone-400 text-xs">
                      {new Date(nft.createdAt).toLocaleDateString("it-IT")}
                    </td>
                  </tr>
                ))}
                {nfts.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-stone-400">Nessun NFT ancora mintato</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
