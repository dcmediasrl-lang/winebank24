import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar role="ADMIN" userName={session.user.name || session.user.email || ""} />
      <main className="flex-1 bg-stone-50 p-8 overflow-auto">{children}</main>
    </div>
  );
}
