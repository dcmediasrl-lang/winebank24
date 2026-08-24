import { requireSession } from "@/lib/require-session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, Package, TrendingUp, CheckCircle2, ShieldAlert, CreditCard, Wine, FileCheck } from "lucide-react";
import Link from "next/link";

export default async function CantinaDashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const session = await requireSession(lang);
  const cantina = await db.cantina.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: { select: { collections: true, nfts: true } },
    },
  });

  const revenue = await db.transaction.aggregate({
    where: { nft: { cantinaId: cantina?.id } },
    _sum: { cantinaFee: true, amount: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">
        Benvenuta, {cantina?.name || "Cantina"}
      </h1>
      <p className="text-[var(--wine-muted)] mb-6">Gestisci i tuoi certificati digitali di bottiglia</p>

      {cantina && <OnboardingChecklist lang={lang} cantina={cantina} nftCount={cantina._count.nfts} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Certificati emessi" value={cantina?._count.nfts ?? 0} icon={Gem} color="text-amber-600" />
        <StatCard title="Royalties (€)" value={`€ ${(revenue._sum.cantinaFee ?? 0).toFixed(2)}`} icon={TrendingUp} color="text-green-600" />
        <StatCard title="Fatturato (€)" value={`€ ${(revenue._sum.amount ?? 0).toFixed(2)}`} icon={Package} color="text-blue-600" />
      </div>

      <RecentNfts cantinaId={cantina?.id} />
    </div>
  );
}

/**
 * Prima di questa checklist, chi arrivava sulla dashboard dopo aver
 * accettato il contratto non aveva alcun indizio su cosa fare dopo: scopriva
 * l'obbligo della polizza solo provando a emettere un certificato e
 * ricevendo un errore. Sparisce da sola appena tutti i passaggi sono
 * completati — non è pensata per restare visibile a chi è già operativo.
 */
function OnboardingChecklist({
  lang,
  cantina,
  nftCount,
}: {
  lang: string;
  cantina: { insuranceDocUrl: string | null; stripeAccountId: string | null };
  nftCount: number;
}) {
  const steps = [
    {
      done: true,
      label: "Contratto accettato",
      description: "Necessario per accedere alla piattaforma.",
      href: null,
      icon: FileCheck,
    },
    {
      done: !!cantina.insuranceDocUrl,
      label: "Polizza assicurativa caricata",
      description: "Obbligatoria (art. A.3 del contratto): senza polizza non puoi emettere certificati.",
      href: `/${lang}/cantina/assicurazione`,
      icon: ShieldAlert,
    },
    {
      done: !!cantina.stripeAccountId,
      label: "Stripe Connect collegato",
      description: "Per ricevere gli incassi automaticamente. Senza, resta solo il bonifico manuale via IBAN.",
      href: `/${lang}/cantina/impostazioni`,
      icon: CreditCard,
    },
    {
      done: nftCount > 0,
      label: "Primo certificato emesso",
      description: "Crea la scheda della tua prima bottiglia da collezione.",
      href: `/${lang}/cantina/nfts`,
      icon: Wine,
    },
  ];

  if (steps.every((s) => s.done)) return null;

  return (
    <Card className="mb-6 border-amber-600/30 bg-amber-950/10">
      <CardHeader>
        <CardTitle className="text-base">Prossimi passi per iniziare</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => {
          const Icon = step.done ? CheckCircle2 : step.icon;
          const content = (
            <div className={`flex items-start gap-3 ${step.href && !step.done ? "hover:opacity-80 transition-opacity" : ""}`}>
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${step.done ? "text-green-400" : "text-white/30"}`} />
              <div>
                <p className={`text-sm font-semibold ${step.done ? "text-white/50 line-through" : "text-white"}`}>
                  {step.label}
                </p>
                {!step.done && <p className="text-xs text-white/40 mt-0.5">{step.description}</p>}
              </div>
            </div>
          );
          return step.href && !step.done ? (
            <Link key={step.label} href={step.href} className="block">
              {content}
            </Link>
          ) : (
            <div key={step.label}>{content}</div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string; value: number | string; icon: React.ElementType; color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[var(--wine-muted)]">{title}</CardTitle>
        <Icon className={`w-5 h-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{value}</div>
      </CardContent>
    </Card>
  );
}

async function RecentNfts({ cantinaId }: { cantinaId?: string }) {
  if (!cantinaId) return null;
  const nfts = await db.nft.findMany({
    where: { cantinaId },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { collection: { select: { name: true } } },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Ultimi certificati emessi</CardTitle></CardHeader>
      <CardContent>
        {nfts.length === 0 ? (
          <p className="text-white/40 text-sm">Nessun certificato ancora. Vai in <strong>I miei certificati</strong> per creare il primo.</p>
        ) : (
          <div className="space-y-3">
            {nfts.map((nft) => (
              <div key={nft.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{nft.name}</p>
                  <p className="text-white/40 text-xs">Bottiglia #{nft.bottleNumber}{nft.vintage ? ` · ${nft.vintage}` : ""}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  nft.status === "LISTED" ? "bg-green-900/40 text-green-400" :
                  nft.status === "SOLD" ? "bg-blue-900/40 text-blue-400" :
                  nft.status === "BURNED" ? "bg-red-900/40 text-red-400" :
                  "bg-white/10 text-white/60"
                }`}>{nft.status}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
