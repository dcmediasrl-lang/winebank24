import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
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

  const dict = await getDictionary(lang);

  return (
    <div className="flex min-h-screen">
      <Sidebar role="COLLECTOR" userName={session.user.name || session.user.email || ""} lang={lang} dict={dict.sidebar} />
      <main className="flex-1 bg-stone-50 p-8 overflow-auto">{children}</main>
    </div>
  );
}
