import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/shared/sidebar";

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    return (
      <div className="min-h-screen bg-stone-50">
        {children}
      </div>
    );
  }

  const role = session.user.role as "ADMIN" | "CANTINA" | "COLLECTOR";

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} userName={session.user.name || session.user.email || ""} />
      <main className="flex-1 bg-stone-50 overflow-auto">{children}</main>
    </div>
  );
}
