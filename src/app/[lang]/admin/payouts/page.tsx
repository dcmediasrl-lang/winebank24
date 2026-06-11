import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, ShieldCheck, AlertCircle } from "lucide-react";

export default async function AdminPayoutsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect(`/${lang}/login`);

  // Aggregate cantinaFee and platformFee per cantina
  const transactions = await db.transaction.findMany({
    where: {
      type: "BUY",
      cantinaFee: { gt: 0 },
    },
    include: {
      nft: {
        include: {
          cantina: {
            select: { id: true, name: true, stripeAccountId: true, user: { select: { email: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by cantina
  const cantinaMap = new Map<string, {
    name: string;
    email: string;
    stripeAccountId: string | null;
    totalCantinaFee: number;
    totalPlatformFee: number;
    txCount: number;
  }>();

  for (const tx of transactions) {
    const cantina = tx.nft?.cantina;
    if (!cantina) continue;
    const existing = cantinaMap.get(cantina.id) ?? {
      name: cantina.name,
      email: cantina.user.email,
      stripeAccountId: cantina.stripeAccountId,
      totalCantinaFee: 0,
      totalPlatformFee: 0,
      txCount: 0,
    };
    existing.totalCantinaFee += tx.cantinaFee;
    existing.totalPlatformFee += tx.platformFee;
    existing.txCount += 1;
    cantinaMap.set(cantina.id, existing);
  }

  const cantinaPayouts = Array.from(cantinaMap.entries()).sort(
    (a, b) => b[1].totalCantinaFee - a[1].totalCantinaFee
  );

  const totalPlatformRevenue = transactions.reduce((s, t) => s + t.platformFee, 0);
  const totalCantinaPayouts = transactions.reduce((s, t) => s + t.cantinaFee, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gestione Pagamenti</h1>
        <p className="text-[var(--wine-muted)] text-sm mt-1">
          Split dei ricavi tra piattaforma e cantine
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[var(--wine-muted)] uppercase tracking-wide mb-1">Ricavo piattaforma</p>
            <p className="text-2xl font-bold text-white">€ {totalPlatformRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[var(--wine-muted)] uppercase tracking-wide mb-1">Da liquidare alle cantine</p>
            <p className="text-2xl font-bold text-amber-400">€ {totalCantinaPayouts.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-[var(--wine-muted)] uppercase tracking-wide mb-1">Transazioni totali</p>
            <p className="text-2xl font-bold text-white">{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-cantina breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="w-4 h-4 text-amber-500" />
            Ripartizione per cantina
          </CardTitle>
        </CardHeader>
        <CardContent>
          {cantinaPayouts.length === 0 ? (
            <p className="text-[var(--wine-muted)] text-sm">Nessuna transazione registrata.</p>
          ) : (
            <div className="space-y-3">
              {cantinaPayouts.map(([cantinaId, data]) => (
                <div
                  key={cantinaId}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#231515] border border-[var(--wine-border)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-white text-sm">{data.name}</p>
                      {data.stripeAccountId ? (
                        <Badge className="text-xs bg-green-900/40 text-green-400 border-green-700/40 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Connect
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-amber-900/30 text-amber-400 border-amber-700/30 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Manuale
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--wine-muted)]">{data.email} · {data.txCount} transazioni</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-amber-400 text-base">€ {data.totalCantinaFee.toFixed(2)}</p>
                    <p className="text-xs text-[var(--wine-muted)]">fee piatt. € {data.totalPlatformFee.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connect info */}
      <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 p-4 text-sm">
        <p className="font-semibold text-amber-400 mb-1">💡 Stripe Connect — pagamenti automatici</p>
        <p className="text-white/60 leading-relaxed">
          Le cantine con badge <span className="text-green-400 font-medium">Connect</span> ricevono i pagamenti automaticamente tramite Stripe.
          Per le cantine con badge <span className="text-amber-400 font-medium">Manuale</span>, aggiungi il loro{" "}
          <code className="bg-white/10 px-1.5 rounded text-xs">stripeAccountId</code> dal pannello
          cantine oppure effettua il bonifico manualmente. Per attivare Connect su una cantina, il titolare deve
          completare l&apos;onboarding su{" "}
          <a href="https://dashboard.stripe.com/connect/accounts" target="_blank" rel="noopener noreferrer"
            className="text-amber-400 hover:underline">
            Stripe Dashboard
          </a>.
        </p>
      </div>
    </div>
  );
}
