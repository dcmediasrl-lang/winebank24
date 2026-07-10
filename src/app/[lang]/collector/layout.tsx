import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { getDictionary, hasLocale } from "../dictionaries";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

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

  // Google OAuth users (no password) must complete profile before accessing collector area
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, firstName: true },
  });
  if (dbUser && !dbUser.password && !dbUser.firstName) {
    redirect(`/${lang}/complete-profile`);
  }

  const dict = await getDictionary(lang);

  return (
    <div className="flex min-h-screen">
      <Sidebar role="COLLECTOR" userName={session.user.name || session.user.email || ""} lang={lang} dict={dict.sidebar} />
      <main className="flex-1 bg-background px-4 pb-8 pt-20 lg:p-8 overflow-auto">{children}</main>
    </div>
  );
}
