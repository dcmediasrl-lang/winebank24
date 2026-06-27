import { db } from "@/lib/db";
import { FeeSettingsForm } from "@/components/admin/fee-settings-form";

export default async function AdminSettingsPage() {
  let config = await db.platformConfig.findFirst();
  if (!config) {
    config = await db.platformConfig.create({
      data: { platformFeePct: 3.0, mintFeePct: 5.0 },
    });
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-white mb-6">Configurazione Piattaforma</h1>
      <FeeSettingsForm
        configId={config.id}
        platformFeePct={config.platformFeePct}
        mintFeePct={config.mintFeePct}
      />
    </div>
  );
}
