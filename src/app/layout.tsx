import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { headers } from "next/headers";
import { Analytics } from "@/components/shared/analytics";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Wine Bank 24 — Certificati digitali per il vino da collezione",
  description:
    "Colleziona bottiglie di vino pregiato: ogni certificato digitale documenta la proprietà e la provenienza di una bottiglia reale, custodita in cantina.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // La lingua sta nel percorso (/it, /en). Il layout radice non riceve i
  // parametri di rotta, quindi la ricaviamo dall'intestazione impostata dal
  // middleware: senza `lang` lettori di schermo e motori di ricerca non sanno
  // in che lingua è la pagina.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const lang = pathname.startsWith("/en") ? "en" : "it";

  return (
    <html lang={lang} className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
      <Analytics gaId="G-9B47H6KMR4" />
    </html>
  );
}
