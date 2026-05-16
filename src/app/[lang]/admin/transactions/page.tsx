import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart, Gem, Flame } from "lucide-react";

export default async function AdminTransactionsPage() {
  const [transactions, totals] = await Promise.all([
    db.transaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        nft: { select: { name: true } },
        buyer: { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
      },
    }),
    db.transaction.aggregate({
      _sum: { amount: true, platformFee: true, cantinaFee: true },
      _count: true,
    }),
  ]);

  const typeColor: Record<string, string> = {
    MINT: "bg-purple-100 text-purple-700",
    BUY: "bg-green-100 text-green-700",
    SELL: "bg-blue-100 text-blue-700",
    BURN: "bg-red-100 text-red-700",
    FEE: "bg-stone-100 text-stone-700",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Transazioni</h1>

      {/* Sommario */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard label="Totale transazioni" value={totals._count} icon={ShoppingCart} color="text-blue-600" />
        <SummaryCard label="Fatturato totale" value={`€ ${(totals._sum.amount ?? 0).toFixed(2)}`} icon={TrendingUp} color="text-green-600" />
        <SummaryCard label="Fee piattaforma" value={`€ ${(totals._sum.platformFee ?? 0).toFixed(2)}`} icon={Gem} color="text-amber-600" />
        <SummaryCard label="Royalties cantine" value={`€ ${(totals._sum.cantinaFee ?? 0).toFixed(2)}`} icon={Flame} color="text-purple-600" />
      </div>

      {/* Tabella */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Storico transazioni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-stone-500 text-left">
                  <th className="pb-3 pr-4">NFT</th>
                  <th className="pb-3 pr-4">Tipo</th>
                  <th className="pb-3 pr-4">Acquirente</th>
                  <th className="pb-3 pr-4">Venditore</th>
                  <th className="pb-3 pr-4">Importo</th>
                  <th className="pb-3 pr-4">Fee piatt.</th>
                  <th className="pb-3 pr-4">Royalty</th>
                  <th className="pb-3 pr-4">Pagamento</th>
                  <th className="pb-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3 pr-4 font-medium">{tx.nft.name}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[tx.type] ?? ""}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-stone-500 text-xs">
                      {tx.buyer ? `${tx.buyer.name ?? tx.buyer.email}` : "—"}
                    </td>
                    <td className="py-3 pr-4 text-stone-500 text-xs">
                      {tx.seller ? `${tx.seller.name ?? tx.seller.email}` : "—"}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-stone-800">
                      {tx.amount > 0 ? `€ ${tx.amount.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3 pr-4 text-stone-500">
                      {tx.platformFee > 0 ? `€ ${tx.platformFee.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3 pr-4 text-stone-500">
                      {tx.cantinaFee > 0 ? `€ ${tx.cantinaFee.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className="text-xs">{tx.paymentMethod}</Badge>
                    </td>
                    <td className="py-3 text-stone-400 text-xs">
                      {new Date(tx.createdAt).toLocaleDateString("it-IT")}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-stone-400">Nessuna transazione ancora</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-stone-500">{label}</span>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="text-2xl font-bold text-stone-900">{value}</div>
      </CardContent>
    </Card>
  );
}
