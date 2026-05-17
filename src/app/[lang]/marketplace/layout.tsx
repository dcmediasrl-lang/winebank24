import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { getDictionary, hasLocale } from "../dictionaries";

export default async function MarketplaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const session = await auth();

  if (!session) {
    return <div className="min-h-screen bg-stone-50">{children}</div>;
  }

  const dict = await getDictionary(lang);
  const role = session.user.role as "ADMIN" | "CANTINA" | "COLLECTOR";

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} userName={session.user.name || session.user.email || ""} lang={lang} dict={dict.sidebar} />
      <main className="flex-1 bg-stone-50 overflow-auto pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
