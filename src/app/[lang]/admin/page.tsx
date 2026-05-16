import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gem, ShoppingCart, TrendingUp } from "lucide-react";

async function getStats() {
  const [users, nfts, transactions, revenue] = await Promise.all([
    db.user.count(),
    db.nft.count(),
    db.transaction.count(),
    db.transaction.aggregate({ _sum: { amount: true } }),
  ]);
  return { users, nfts, transactions, revenue: revenue._sum.amount ?? 0 };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Pannello di Controllo</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Utenti totali" value={stats.users} icon={Users} color="text-blue-600" />
        <StatCard title="NFT mintati" value={stats.nfts} icon={Gem} color="text-amber-600" />
        <StatCard title="Transazioni" value={stats.transactions} icon={ShoppingCart} color="text-green-600" />
        <StatCard title="Fatturato (€)" value={`€ ${stats.revenue.toFixed(2)}`} icon={TrendingUp} color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentUsers />
        <RecentTransactions />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string; value: number | string; icon: React.ElementType; color: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-stone-500">{title}</CardTitle>
        <Icon className={`w-5 h-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-stone-900">{value}</div>
      </CardContent>
    </Card>
  );
}

async function RecentUsers() {
  const users = await db.user.findMany({ take: 5, orderBy: { createdAt: "desc" } });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Ultimi utenti registrati</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{u.name || "—"}</p>
                <p className="text-stone-400 text-xs">{u.email}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                u.role === "ADMIN" ? "bg-red-100 text-red-700" :
                u.role === "CANTINA" ? "bg-amber-100 text-amber-700" :
                "bg-blue-100 text-blue-700"
              }`}>{u.role}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function RecentTransactions() {
  const txs = await db.transaction.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { nft: { select: { name: true } } },
  });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Ultime transazioni</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {txs.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{tx.nft.name}</p>
                <p className="text-stone-400 text-xs">{tx.type} · {new Date(tx.createdAt).toLocaleDateString("it-IT")}</p>
              </div>
              <span className="font-semibold text-green-700">€ {tx.amount.toFixed(2)}</span>
            </div>
          ))}
          {txs.length === 0 && <p className="text-stone-400 text-sm">Nessuna transazione ancora.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
