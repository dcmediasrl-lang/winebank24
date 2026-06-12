import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Wine Bank 24 — NFT per il vino italiano",
  description: "Tokenizza, colleziona e commercia bottiglie di vino pregiate come NFT",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
