import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SecuritySettings } from "@/components/collector/security-settings";

export default async function SettingsPage() {
  const session = await auth();
  const user = await db.user.findUnique({
    where: { id: session!.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      birthDate: true,
      country: true,
      fiscalCode: true,
      kycVerifiedAt: true,
      emailVerified: true,
      twoFactorEnabled: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Impostazioni account</h1>
        <p className="text-stone-500 text-sm mt-1">Gestisci la sicurezza e i tuoi dati personali</p>
      </div>
      <SecuritySettings user={user!} />
    </div>
  );
}
