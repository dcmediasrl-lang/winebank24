"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Wine, Menu, X } from "lucide-react";
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
    <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-stone-800 sticky top-0 z-40 bg-stone-950">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Wine className="w-6 h-6 text-amber-400" />
        <span className="font-bold text-lg text-white">Wine Bank 24</span>
      </div>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-3">
        <Link href={`/${lang}/marketplace`} className={cn(buttonVariants({ variant: "ghost" }), "text-stone-300 hover:text-white")}>
          {nav.marketplace}
        </Link>
        <Link href={`/${lang}/blog`} className={cn(buttonVariants({ variant: "ghost" }), "text-stone-300 hover:text-white")}>
          {nav.blog}
        </Link>
        <Link href={`/${lang}/login`} className={cn(buttonVariants({ variant: "outline" }), "border-stone-600 text-stone-200 hover:bg-stone-800")}>
          {nav.login}
        </Link>
        <Link href={`/${lang}/register`} className={cn(buttonVariants(), "bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold")}>
          {nav.register}
        </Link>
        <Link href={lang === "en" ? "/it" : "/en"} className="text-stone-500 text-xs hover:text-amber-400 transition-colors ml-2">
          {lang === "en" ? "🇮🇹 IT" : "🇬🇧 EN"}
        </Link>
      </div>

      {/* Mobile: lang switcher + hamburger */}
      <div className="flex md:hidden items-center gap-3">
        <Link href={lang === "en" ? "/it" : "/en"} className="text-stone-500 text-xs hover:text-amber-400 transition-colors">
          {lang === "en" ? "🇮🇹 IT" : "🇬🇧 EN"}
        </Link>
        <button onClick={() => setOpen(true)} className="text-stone-300 hover:text-white p-1">
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
        "fixed top-0 right-0 z-50 h-full w-72 bg-stone-900 flex flex-col p-6 shadow-2xl transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Wine className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-stone-100">Wine Bank 24</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-3 flex-1">
          <Link
            href={`/${lang}/marketplace`}
            onClick={() => setOpen(false)}
            className="text-stone-300 hover:text-amber-400 py-2 border-b border-stone-800 transition-colors"
          >
            {nav.marketplace}
          </Link>
          <Link
            href={`/${lang}/blog`}
            onClick={() => setOpen(false)}
            className="text-stone-300 hover:text-amber-400 py-2 border-b border-stone-800 transition-colors"
          >
            {nav.blog}
          </Link>
        </nav>

        <div className="flex flex-col gap-3 mt-auto pt-6">
          <Link
            href={`/${lang}/login`}
            onClick={() => setOpen(false)}
            className={cn(buttonVariants({ variant: "outline" }), "border-stone-600 text-stone-200 hover:bg-stone-800 w-full justify-center")}
          >
            {nav.login}
          </Link>
          <Link
            href={`/${lang}/register`}
            onClick={() => setOpen(false)}
            className={cn(buttonVariants(), "bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold w-full justify-center")}
          >
            {nav.register}
          </Link>
        </div>
      </div>
    </header>
  );
}
