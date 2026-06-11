import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { HomeNav } from "@/components/shared/home-nav";
import { getDictionary, hasLocale } from "../dictionaries";

export default async function NftLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const session = await auth();
  const dict = await getDictionary(lang);

  // Logged-in users: show the sidebar (same as marketplace/collector dashboards)
  if (session) {
    const role = session.user.role as "ADMIN" | "CANTINA" | "COLLECTOR";
    return (
      <div className="flex min-h-screen">
        <Sidebar
          role={role}
          userName={session.user.name || session.user.email || ""}
          lang={lang}
          dict={dict.sidebar}
        />
        <main className="flex-1 bg-background overflow-auto pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    );
  }

  // Logged-out users: show the public HomeNav
  const dashboardUrl = null;
  return (
    <div className="min-h-screen bg-background">
      <HomeNav
        lang={lang}
        nav={dict.nav}
        dashboardUrl={dashboardUrl}
        userName={null}
      />
      <main className="pt-20">{children}</main>
    </div>
  );
}
