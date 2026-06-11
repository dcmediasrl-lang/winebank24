import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { InsuranceUploadForm } from "@/components/cantina/insurance-upload-form";
import { ShieldCheck, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AssicurazionePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") redirect(`/${lang}/login`);

  const cantina = await db.cantina.findUnique({
    where: { userId: session.user.id },
    select: { name: true, insuranceDocUrl: true, insuranceUploadedAt: true, contractAcceptedAt: true },
  });

  if (!cantina) redirect(`/${lang}/cantina`);

  const hasContract = !!cantina.contractAcceptedAt;
  const hasInsurance = !!cantina.insuranceDocUrl;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Polizza Assicurativa</h1>
        <p className="text-[var(--wine-muted)] text-sm mt-1">
          Carica la polizza All Risks a copertura dei beni certificati su Wine Bank 24
        </p>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <FileText className="w-4 h-4" />
              Contratto Creator
            </div>
            {hasContract ? (
              <Badge className="bg-green-900/40 text-green-400 border-green-700/40">Accettato</Badge>
            ) : (
              <Badge className="bg-red-900/40 text-red-400 border-red-700/40">Non accettato</Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <ShieldCheck className="w-4 h-4" />
              Polizza assicurativa
            </div>
            {hasInsurance ? (
              <Badge className="bg-green-900/40 text-green-400 border-green-700/40">Caricata</Badge>
            ) : (
              <Badge className="bg-amber-900/30 text-amber-400 border-amber-700/30">Da caricare</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info box */}
      <div className="rounded-xl border border-amber-700/30 bg-amber-900/10 p-4 text-sm space-y-2">
        <div className="flex items-center gap-2 font-semibold text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Obbligo contrattuale — art. A.3
        </div>
        <p className="text-white/60 leading-relaxed">
          Il Contratto Creator richiede una <strong className="text-white/80">polizza All Risks</strong> per il valore totale
          dei beni certificati, con Wine Bank 24 e i titolari di certificati come beneficiari in caso di sinistro.
          La polizza deve essere presentata entro <strong className="text-white/80">30 giorni</strong> dall&apos;accettazione
          del contratto e rinnovata annualmente.
        </p>
      </div>

      {/* Upload form */}
      <InsuranceUploadForm
        currentDocUrl={cantina.insuranceDocUrl}
        uploadedAt={cantina.insuranceUploadedAt}
      />
    </div>
  );
}
