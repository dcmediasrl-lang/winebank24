import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Database } from "lucide-react";
import { WineDbManager } from "@/components/admin/wine-db-manager";

export default async function AdminWineDbPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const denominations = await db.wineDenomination.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const docgCount = denominations.filter((d) => d.type === "DOCG").length;
  const docCount = denominations.filter((d) => d.type === "DOC").length;
  const igtCount = denominations.filter((d) => d.type === "IGT").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="w-7 h-7 text-amber-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Database Vini</h1>
          <p className="text-[var(--wine-muted)] text-sm mt-0.5">
            Denominazioni DOC/DOCG/IGT — {denominations.length} totali
          </p>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-700/20 border border-red-700/40">
          <span className="text-xs font-semibold text-red-400">DOCG</span>
          <span className="text-lg font-bold text-white">{docgCount}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-600/20 border border-orange-600/40">
          <span className="text-xs font-semibold text-orange-400">DOC</span>
          <span className="text-lg font-bold text-white">{docCount}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-600/20 border border-gray-600/40">
          <span className="text-xs font-semibold text-gray-400">IGT</span>
          <span className="text-lg font-bold text-white">{igtCount}</span>
        </div>
      </div>

      <WineDbManager initialDenominations={denominations} />
    </div>
  );
}
