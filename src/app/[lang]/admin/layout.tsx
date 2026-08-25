import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { HomeNav } from "@/components/shared/home-nav";
import { getDictionary, hasLocale } from "../dictionaries";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect(`/${lang}/login`);

  const dict = await getDictionary(lang);
  const userLabel = session.user.name || session.user.email || "";

  return (
    <div>
      {/* Su schermi grandi la barra pubblica resta visibile anche dentro
          l'area riservata — su mobile resta invece l'intestazione compatta
          della sidebar, che apre il menu con tutte le voci della dashboard */}
      <div className="hidden lg:block">
        <HomeNav lang={lang} nav={dict.nav} dashboardUrl={`/${lang}/admin`} userName={userLabel} />
      </div>
      <div className="flex min-h-screen lg:pt-[112px]">
        <Sidebar role="ADMIN" userName={userLabel} lang={lang} dict={dict.sidebar} />
        <main className="flex-1 bg-background px-4 pb-8 pt-20 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
