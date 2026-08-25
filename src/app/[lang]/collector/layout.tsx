import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { HomeNav } from "@/components/shared/home-nav";
import { getDictionary, hasLocale } from "../dictionaries";
import { notFound } from "next/navigation";

export default async function CollectorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const session = await auth();
  if (!session) redirect(`/${lang}/login`);

  // Every collector must have completed the profile (name, birthdate,
  // fiscal code, 18+ and T&C) before accessing the platform
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true },
  });
  if (!dbUser?.firstName) redirect(`/${lang}/complete-profile`);

  const dict = await getDictionary(lang);
  const userLabel = session.user.name || session.user.email || "";

  return (
    <div>
      {/* Su schermi grandi la barra pubblica resta visibile anche dentro
          l'area riservata — su mobile resta invece l'intestazione compatta
          della sidebar, che apre il menu con tutte le voci della dashboard */}
      <div className="hidden lg:block">
        <HomeNav lang={lang} nav={dict.nav} dashboardUrl={`/${lang}/collector`} userName={userLabel} />
      </div>
      <div className="flex min-h-screen lg:pt-[112px]">
        <Sidebar role="COLLECTOR" userName={userLabel} lang={lang} dict={dict.sidebar} />
        <main className="flex-1 bg-background px-4 pb-8 pt-20 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
