import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Gem, ShoppingCart, Euro } from "lucide-react";

export default async function CantinaReportsPage() {
  const session = await auth();

  const cantina = await db.cantina.findUnique({ where: { userId: session!.user.id } });
  if (!cantina) return <p className="text-[var(--wine-muted)]">Profilo cantina non trovato.</p>;

  const [transactions, nftStats, collections] = await Promise.all([
    db.transaction.findMany({
      where: { nft: { cantinaId: cantina.id } },
      orderBy: { createdAt: "desc" },
      include: {
        nft: { select: { name: true, bottleNumber: true } },
        buyer: { select: { name: true, email: true } },
      },
    }),
    db.nft.groupBy({
      by: ["status"],
      where: { cantinaId: cantina.id },
      _count: true,
    }),
    db.collection.findMany({
      where: { cantinaId: cantina.id },
      include: { _count: { select: { nfts: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totals = transactions.reduce(
    (acc, tx) => ({
      fatturato: acc.fatturato + (tx.type === "BUY" ? tx.amount : 0),
      royalties: acc.royalties + tx.cantinaFee,
      vendite: acc.vendite + (tx.type === "BUY" ? 1 : 0),
    }),
    { fatturato: 0, royalties: 0, vendite: 0 }
  );

  const statusMap = Object.fromEntries(nftStats.map(s => [s.status, s._count]));

  const typeLabel: Record<string, string> = {
    MINT: "Minting", BUY: "Vendita", SELL: "Rivendita", BURN: "Burn", FEE: "Fee",
  };
  const typeColor: Record<string, string> = {
    MINT: "bg-purple-900/40 text-purple-400",
    BUY: "bg-green-900/40 text-green-400",
    SELL: "bg-blue-900/40 text-blue-400",
    BURN: "bg-red-900/40 text-red-400",
    FEE: "bg-white/10 text-[var(--wine-muted)]",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Reportistica</h1>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Fatturato totale" value={`€ ${totals.fatturato.toFixed(2)}`} icon={Euro} color="text-green-600" />
        <KpiCard label="Royalties incassate" value={`€ ${totals.royalties.toFixed(2)}`} icon={TrendingUp} color="text-[#df071b]" />
        <KpiCard label="NFT venduti" value={totals.vendite} icon={ShoppingCart} color="text-blue-600" />
        <KpiCard label="NFT mintati totali" value={Object.values(statusMap).reduce((a, b) => a + b, 0)} icon={Gem} color="text-purple-600" />
      </div>

      {/* Stato NFT */}
      <Card>
        <CardHeader><CardTitle className="text-base">Stato NFT per categoria</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[
              { key: "MINTED", label: "In collezione", color: "bg-white/10 text-white/70" },
              { key: "LISTED", label: "In vendita", color: "bg-green-900/40 text-green-400" },
              { key: "SOLD", label: "Venduti", color: "bg-blue-900/40 text-blue-400" },
              { key: "BURN_REQUESTED", label: "Bottiglia richiesta", color: "bg-orange-900/40 text-orange-400" },
              { key: "BURNED", label: "Bruciati", color: "bg-red-900/40 text-red-400" },
            ].map(({ key, label, color }) => (
              <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${color}`}>
                <span className="text-sm font-medium">{label}</span>
                <span className="text-lg font-bold">{statusMap[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collezioni */}
      <Card>
        <CardHeader><CardTitle className="text-base">Riepilogo collezioni</CardTitle></CardHeader>
        <CardContent>
          {collections.length === 0 ? (
            <p className="text-[var(--wine-muted)] text-sm">Nessuna collezione ancora.</p>
          ) : (
            <div className="space-y-3">
              {collections.map((col) => {
                const pct = Math.round((col.minted / col.totalSupply) * 100);
                return (
                  <div key={col.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{col.name}</span>
                      <span className="text-[var(--wine-muted)]">{col.minted} / {col.totalSupply} mintati ({pct}%)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-[#993300] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storico transazioni */}
      <Card>
        <CardHeader><CardTitle className="text-base">Storico transazioni</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-[var(--wine-muted)] text-sm text-center py-6">Nessuna transazione ancora.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--wine-border)] text-[var(--wine-muted)] text-left">
                    <th className="pb-3 pr-4">NFT</th>
                    <th className="pb-3 pr-4">Tipo</th>
                    <th className="pb-3 pr-4">Acquirente</th>
                    <th className="pb-3 pr-4">Importo</th>
                    <th className="pb-3 pr-4">Royalty</th>
                    <th className="pb-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--wine-border)]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[var(--wine-card-hover)]">
                      <td className="py-3 pr-4 font-medium">
                        {tx.nft.name}
                        <span className="block text-xs text-white/70">Bottiglia #{tx.nft.bottleNumber}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[tx.type] ?? ""}`}>
                          {typeLabel[tx.type] ?? tx.type}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[var(--wine-muted)] text-xs">
                        {tx.buyer ? (tx.buyer.name ?? tx.buyer.email) : "—"}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-white">
                        {tx.amount > 0 ? `€ ${tx.amount.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 pr-4 text-[#df071b]">
                        {tx.cantinaFee > 0 ? `€ ${tx.cantinaFee.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 text-white/70 text-xs">
                        {new Date(tx.createdAt).toLocaleDateString("it-IT")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--wine-muted)]">{label}</span>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="text-2xl font-bold text-white">{value}</div>
      </CardContent>
    </Card>
  );
}
