import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Wine Bank 24 — NFT per i vini da collezione",
  description: "Tokenizza, colleziona e commercia bottiglie di vino pregiate come NFT",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
      <GoogleAnalytics gaId="G-9B47H6KMR4" />
    </html>
  );
}
