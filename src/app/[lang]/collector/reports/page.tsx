import { requireSession } from "@/lib/require-session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, TrendingUp, Gem, Package } from "lucide-react";
import Link from "next/link";

export default async function CollectorReportsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await requireSession(lang);

  const [transactions, nftStats] = await Promise.all([
    db.transaction.findMany({
      where: {
        OR: [
          { buyerId: session.user.id },
          { sellerId: session.user.id },
        ],
        type: { in: ["BUY", "SELL"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        nft: {
          select: {
            name: true,
            bottleNumber: true,
            cantina: { select: { name: true } },
          },
        },
      },
    }),
    db.nft.groupBy({
      by: ["status"],
      where: { ownerId: session.user.id },
      _count: true,
    }),
  ]);

  const totals = transactions.reduce(
    (acc, tx) => ({
      speso: acc.speso + (tx.buyerId === session.user.id ? tx.amount : 0),
      incassato: acc.incassato + (tx.sellerId === session.user.id ? tx.amount : 0),
      acquisti: acc.acquisti + (tx.type === "BUY" ? 1 : 0),
      vendite: acc.vendite + (tx.type === "SELL" ? 1 : 0),
    }),
    { speso: 0, incassato: 0, acquisti: 0, vendite: 0 }
  );

  const statusMap = Object.fromEntries(nftStats.map(s => [s.status, s._count]));
  const totaleNft = Object.values(statusMap).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Storico & Reportistica</h1>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="NFT in mio possesso" value={totaleNft} icon={Gem} color="text-[#df071b]" />
        <KpiCard label="Acquisti effettuati" value={totals.acquisti} icon={ShoppingCart} color="text-blue-600" />
        <KpiCard label="Vendite effettuate" value={totals.vendite} icon={TrendingUp} color="text-green-600" />
        <KpiCard label="Totale speso" value={`€ ${totals.speso.toFixed(2)}`} icon={Package} color="text-red-500" />
      </div>

      {/* Stato NFT posseduti */}
      {totaleNft > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">I tuoi NFT per stato</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {[
                { key: "MINTED", label: "In collezione", color: "bg-white/10 text-white/70" },
                { key: "LISTED", label: "In vendita", color: "bg-green-900/40 text-green-400" },
                { key: "BURN_REQUESTED", label: "Bottiglia richiesta", color: "bg-orange-900/40 text-orange-400" },
              ].map(({ key, label, color }) =>
                statusMap[key] ? (
                  <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${color}`}>
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-lg font-bold">{statusMap[key]}</span>
                  </div>
                ) : null
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storico transazioni */}
      <Card>
        <CardHeader><CardTitle className="text-base">Storico acquisti e vendite</CardTitle></CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-[var(--wine-muted)] text-sm text-center py-8">
              Nessuna transazione ancora. Visita il <Link href={`/${lang}/marketplace`} className="text-[#df071b] hover:underline">Marketplace</Link> per acquistare il tuo primo NFT.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--wine-border)] text-[var(--wine-muted)] text-left">
                    <th className="pb-3 pr-4">NFT</th>
                    <th className="pb-3 pr-4">Cantina</th>
                    <th className="pb-3 pr-4">Operazione</th>
                    <th className="pb-3 pr-4">Importo</th>
                    <th className="pb-3">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--wine-border)]">
                  {transactions.map((tx) => {
                    const isAcquisto = tx.buyerId === session.user.id;
                    return (
                      <tr key={tx.id} className="hover:bg-[var(--wine-card-hover)]">
                        <td className="py-3 pr-4 font-medium">
                          {tx.nft.name}
                          <span className="block text-xs text-white/70">Bottiglia #{tx.nft.bottleNumber}</span>
                        </td>
                        <td className="py-3 pr-4 text-[var(--wine-muted)] text-xs">{tx.nft.cantina.name}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isAcquisto ? "bg-blue-900/40 text-blue-400" : "bg-green-900/40 text-green-400"
                          }`}>
                            {isAcquisto ? "Acquisto" : "Vendita"}
                          </span>
                        </td>
                        <td className={`py-3 pr-4 font-semibold ${isAcquisto ? "text-red-600" : "text-green-600"}`}>
                          {isAcquisto ? "−" : "+"}€ {tx.amount.toFixed(2)}
                        </td>
                        <td className="py-3 text-white/70 text-xs">
                          {new Date(tx.createdAt).toLocaleDateString("it-IT")}
                        </td>
                      </tr>
                    );
                  })}
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
