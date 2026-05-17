import type { Metadata } from "next";
import { Geist, Source_Sans_3, DM_Sans } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans", weight: ["400", "600", "700", "900"] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["400", "500", "700", "800"] });

export const metadata: Metadata = {
  title: "Wine Bank 24 — NFT per il vino italiano",
  description: "Tokenizza, colleziona e commercia bottiglie di vino pregiate come NFT",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${geist.variable} ${sourceSans.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
