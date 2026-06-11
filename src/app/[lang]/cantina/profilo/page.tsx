import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CantinaProfileForm } from "@/components/cantina/cantina-profile-form";

export default async function CantinaProfiloPage({
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
    },
  });

  if (!cantina) redirect(`/${lang}/cantina`);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Il mio Profilo</h1>
        <p className="text-[var(--wine-muted)] text-sm mt-1">
          Queste informazioni appaiono pubblicamente sulla tua pagina cantina
        </p>
      </div>
      <CantinaProfileForm lang={lang} cantina={cantina} />
    </div>
  );
}
