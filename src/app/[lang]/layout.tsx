import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, getDictionary } from "./dictionaries";
import { Footer } from "@/components/shared/footer";
import { CookieBanner } from "@/components/shared/cookie-banner";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Wine Bank 24 — NFT per i vini da collezione",
  description: "Tokenizza, colleziona e commercia bottiglie di vino pregiate come NFT",
};

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
