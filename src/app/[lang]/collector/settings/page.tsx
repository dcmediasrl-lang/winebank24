import { requireSession } from "@/lib/require-session";
import { db } from "@/lib/db";
import { SecuritySettings } from "@/components/collector/security-settings";
import { ProfileSettings } from "@/components/collector/profile-settings";

export default async function SettingsPage() {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
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
      username: true,
      avatarUrl: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Impostazioni account</h1>
        <p className="text-[var(--wine-muted)] text-sm mt-1">Gestisci la sicurezza e i tuoi dati personali</p>
      </div>
      <ProfileSettings user={{ username: user?.username ?? null, avatarUrl: user?.avatarUrl ?? null }} />
      <SecuritySettings user={user!} />
    </div>
  );
}
