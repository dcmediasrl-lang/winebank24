import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Gem, TrendingUp, ShoppingCart, BarChart3 } from "lucide-react";
import Link from "next/link";

export default async function CollectorDashboardPage() {
  const session = await auth();

  const [nfts, fractions, transactions] = await Promise.all([
    db.nft.findMany({ where: { ownerId: session!.user.id }, select: { id: true } }),
    db.nftFraction.findMany({ where: { ownerId: session!.user.id }, select: { id: true, investedAmount: true } }),
    db.transaction.findMany({
      where: { buyerId: session!.user.id, type: "BUY" },
      select: { amount: true },
    }),
  ]);

  const totaleInvestito = fractions.reduce((acc, f) => acc + Number(f.investedAmount), 0);
  const totaleSpeso = transactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Benvenuto, {session!.user.name || session!.user.email}
        </h1>
        <p className="text-[var(--wine-muted)] text-sm mt-1">Il tuo portafoglio Wine Bank 24</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--wine-muted)]">NFT posseduti</span>
              <Gem className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-white">{nfts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--wine-muted)]">Quote possedute</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-white">{fractions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--wine-muted)]">Totale quote acquistate</span>
              <BarChart3 className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-white">€ {totaleInvestito.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--wine-muted)]">Totale acquisti</span>
              <ShoppingCart className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-white">€ {totaleSpeso.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/collector/portfolio" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-amber-100">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Gem className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="font-semibold text-white">La mia Collezione</p>
                  <p className="text-xs text-[var(--wine-muted)]">Gestisci i tuoi NFT e quote</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/marketplace" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-100">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="font-semibold text-white">Marketplace</p>
                  <p className="text-xs text-[var(--wine-muted)]">Acquista NFT e quote di bottiglie</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
