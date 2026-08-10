import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, getDictionary } from "./dictionaries";
import { Footer } from "@/components/shared/footer";
import { CookieBanner } from "@/components/shared/cookie-banner";
import { Toaster } from "sonner";
import { metadatiPagina, testo } from "@/lib/seo";

// La home è la pagina che questo layout avvolge quando il percorso è /it o /en
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const t = testo("home", lang);
  return metadatiPagina({ lang, titolo: t.titolo, descrizione: t.descrizione });
}

export async function generateStaticParams() {
  return [{ lang: "it" }, { lang: "en" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      {children}
      <Footer dict={dict} lang={lang} />
      <CookieBanner lang={lang} />
      <Toaster richColors position="top-right" />
    </>
  );
}
