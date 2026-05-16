import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Wine Bank 24 — NFT per il vino italiano",
  description: "Tokenizza, colleziona e commercia bottiglie di vino pregiate come NFT",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
