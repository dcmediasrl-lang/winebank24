"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HomeNavProps {
  lang: string;
  nav: {
    marketplace: string;
    blog: string;
    login: string;
    register: string;
  };
}

export function HomeNav({ lang, nav }: HomeNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 sm:px-10 py-4 sticky top-0 z-40" style={{ background: "var(--ev-dark)" }}>
      {/* Logo */}
      <Link href={`/${lang}`}>
        <Image src="/logo.png" alt="Wine Bank 24" width={100} height={50} className="h-10 w-auto object-contain bg-white rounded-lg px-2 py-1" priority />
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-3">
        <Link href={`/${lang}/marketplace`} className="text-white/80 hover:text-white uppercase text-sm tracking-wider font-semibold px-3 py-2 transition-colors">
          {nav.marketplace}
        </Link>
        <Link href={`/${lang}/blog`} className="text-white/80 hover:text-white uppercase text-sm tracking-wider font-semibold px-3 py-2 transition-colors">
          {nav.blog}
        </Link>
        <Link href={`/${lang}/login`} className={cn(buttonVariants({ variant: "outline" }), "border-white/50 text-white hover:bg-white/10 hover:border-white")}>
          {nav.login}
        </Link>
        <Link href={`/${lang}/register`} className={cn(buttonVariants(), "text-white font-semibold")} style={{ background: "var(--ev-coral)" }}>
          {nav.register}
        </Link>
        <Link href={lang === "en" ? "/it" : "/en"} className="text-white/50 text-xs hover:text-white transition-colors ml-2">
          {lang === "en" ? "🇮🇹 IT" : "🇬🇧 EN"}
        </Link>
      </div>

      {/* Mobile: lang switcher + hamburger */}
      <div className="flex md:hidden items-center gap-3">
        <Link href={lang === "en" ? "/it" : "/en"} className="text-white/50 text-xs hover:text-white transition-colors">
          {lang === "en" ? "🇮🇹 IT" : "🇬🇧 EN"}
        </Link>
        <button onClick={() => setOpen(true)} className="text-white/80 hover:text-white p-1">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        "fixed top-0 right-0 z-50 h-full w-72 flex flex-col p-6 shadow-2xl transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )} style={{ background: "var(--ev-dark)" }}>
        <div className="flex items-center justify-between mb-8">
          <Image src="/logo.png" alt="Wine Bank 24" width={90} height={45} className="h-9 w-auto object-contain bg-white rounded-lg px-2 py-1" />
          <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-3 flex-1">
          <Link
            href={`/${lang}/marketplace`}
            onClick={() => setOpen(false)}
            className="text-white/80 hover:text-white py-2 border-b border-white/10 transition-colors uppercase text-sm tracking-wider font-semibold"
          >
            {nav.marketplace}
          </Link>
          <Link
            href={`/${lang}/blog`}
            onClick={() => setOpen(false)}
            className="text-white/80 hover:text-white py-2 border-b border-white/10 transition-colors uppercase text-sm tracking-wider font-semibold"
          >
            {nav.blog}
          </Link>
        </nav>

        <div className="flex flex-col gap-3 mt-auto pt-6">
          <Link
            href={`/${lang}/login`}
            onClick={() => setOpen(false)}
            className={cn(buttonVariants({ variant: "outline" }), "border-white/50 text-white hover:bg-white/10 hover:border-white w-full justify-center")}
          >
            {nav.login}
          </Link>
          <Link
            href={`/${lang}/register`}
            onClick={() => setOpen(false)}
            className={cn(buttonVariants(), "text-white font-semibold w-full justify-center")}
            style={{ background: "var(--ev-coral)" }}
          >
            {nav.register}
          </Link>
        </div>
      </div>
    </header>
  );
}
