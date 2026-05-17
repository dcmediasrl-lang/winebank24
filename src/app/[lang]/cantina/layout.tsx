import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { getDictionary, hasLocale } from "../dictionaries";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export default async function CantinaLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const session = await auth();
  if (!session || (session.user.role !== "CANTINA" && session.user.role !== "ADMIN")) {
    redirect(`/${lang}/login`);
  }

  // Contract gate — cantina must accept contract before accessing the dashboard
  if (session.user.role === "CANTINA") {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") ?? headersList.get("x-invoke-path") ?? "";
    const isOnContrattoPage = pathname.endsWith("/cantina/contratto");

    if (!isOnContrattoPage) {
      const cantina = await db.cantina.findUnique({
        where: { userId: session.user.id },
        select: { contractAcceptedAt: true },
      });
      // Only redirect if cantina profile exists but contract not yet accepted
      if (cantina && !cantina.contractAcceptedAt) {
        redirect(`/${lang}/cantina/contratto`);
      }
    }
  }

  const dict = await getDictionary(lang);

  return (
    <div className="flex min-h-screen">
      <Sidebar role="CANTINA" userName={session.user.name || session.user.email || ""} lang={lang} dict={dict.sidebar} />
      <main className="flex-1 bg-background px-4 pb-8 pt-20 lg:p-8 overflow-auto">{children}</main>
    </div>
  );
}
