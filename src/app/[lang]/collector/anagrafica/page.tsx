import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnagraficaForm } from "@/components/collector/anagrafica-form";

export default async function AnagraficaPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const en = lang === "en";
  const session = await auth();

  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    select: { firstName: true, lastName: true, birthDate: true, country: true, fiscalCode: true },
  });

  const initial = {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    birthDate: user?.birthDate ? user.birthDate.toISOString().split("T")[0] : "",
    country: user?.country ?? "IT",
    fiscalCode: user?.fiscalCode ?? "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">{en ? "Personal details" : "Anagrafica"}</h1>
        <p className="text-sm text-[var(--wine-muted)]">
          {en
            ? "Update your personal details if they have changed."
            : "Aggiorna i tuoi dati anagrafici se sono cambiati."}
        </p>
      </div>
      <AnagraficaForm lang={lang} initial={initial} />
    </div>
  );
}
