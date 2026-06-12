import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CantinaSettings } from "@/components/cantina/cantina-settings";
import { Suspense } from "react";

export default async function CantinaImpostazioniPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session || session.user.role !== "CANTINA") redirect(`/${lang}/login`);

  const cantina = await db.cantina.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      description: true,
      location: true,
      website: true,
      logoUrl: true,
      vatNumber: true,
      isVerified: true,
      royaltyPct: true,
      contractAcceptedAt: true,
      stripeAccountId: true,
      insuranceDocUrl: true,
      insuranceUploadedAt: true,
      iban: true,
      bic: true,
      bankName: true,
    },
  });

  if (!cantina) redirect(`/${lang}/cantina`);

  return (
    <Suspense>
      <CantinaSettings cantina={cantina} lang={lang} />
    </Suspense>
  );
}
