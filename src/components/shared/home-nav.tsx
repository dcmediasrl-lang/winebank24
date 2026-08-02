"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard, LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HomeNavProps {
  lang: string;
  nav: {
    marketplace: string;
    blog: string;
    login: string;
    register: string;
  };
  dashboardUrl?: string | null;
  userName?: string | null;
  /** §15 — una sezione vuota non deve comparire in navigazione */
  hasBlogPosts?: boolean;
}

export function HomeNav({ lang, nav, dashboardUrl, userName, hasBlogPosts = false }: HomeNavProps) {
  const [open, setOpen] = useState(false);
  const isLoggedIn = !!dashboardUrl;

  const navLinks = [
    { href: `/${lang}/marketplace`, label: nav.marketplace },
    ...(hasBlogPosts ? [{ href: `/${lang}/blog`, label: nav.blog }] : []),
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm flex items-center justify-between px-6 sm:px-10 py-0">

      {/* Logo sinistra */}
      <Link href={`/${lang}`}>
        <Image src="/logo.svg" alt="Wine Bank 24" width={300} height={112} style={{ height: "112px", width: "auto" }} />
      </Link>

      {/* Desktop — destra */}
      <div className="hidden md:flex items-center gap-3">
        {navLinks.map(l => (
          <Link key={l.href} href={l.href}
            className="font-medium px-3 py-2 text-stone-600 hover:text-stone-900 uppercase text-sm tracking-wide transition-colors">
            {l.label}
          </Link>
        ))}
        {isLoggedIn ? (
          <>
            {userName && <span className="text-xs text-stone-400 px-2 hidden lg:block truncate max-w-[140px]">{userName}</span>}
            <Link href={dashboardUrl!}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: "var(--wine-gradient)" }}>
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link href={`/${lang}/login`}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-stone-700 border border-stone-300 hover:bg-stone-50 text-sm transition-colors">
              <LogIn className="w-4 h-4" /> {nav.login}
            </Link>
            <Link href={`/${lang}/register`}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: "var(--wine-gradient)" }}>
              <UserPlus className="w-4 h-4" /> {nav.register}
            </Link>
          </>
        )}
        <Link href={lang === "en" ? "/it" : "/en"}
          className="text-xs text-stone-400 hover:text-stone-700 transition-colors ml-1">
          {lang === "en" ? "🇮🇹 IT" : "🇬🇧 EN"}
        </Link>
      </div>

      {/* Mobile: lang + hamburger */}
      <div className="flex md:hidden items-center gap-3">
        <Link href={lang === "en" ? "/it" : "/en"} className="text-xs text-stone-400 hover:text-stone-700 transition-colors">
          {lang === "en" ? "🇮🇹 IT" : "🇬🇧 EN"}
        </Link>
        <button onClick={() => setOpen(true)} className="text-stone-600 hover:text-stone-900 p-1 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />}

      {/* Mobile drawer */}
      <div className={cn(
        "fixed top-0 right-0 z-50 h-full w-72 flex flex-col p-6 shadow-2xl transition-transform duration-300 bg-white",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-8">
          <Image src="/logo.svg" alt="Wine Bank 24" width={107} height={40} className="h-10 w-auto" />
          <button onClick={() => setOpen(false)} className="text-stone-500 hover:text-stone-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {isLoggedIn && userName && (
          <div className="mb-4 px-1 pb-4 border-b border-stone-200">
            <p className="text-xs text-stone-400 uppercase tracking-wide">Connesso come</p>
            <p className="text-stone-800 font-semibold text-sm mt-0.5 truncate">{userName}</p>
          </div>
        )}
        <nav className="flex flex-col gap-1 flex-1">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="py-3 px-2 font-medium text-stone-700 hover:text-stone-900 uppercase text-sm tracking-wider rounded-lg hover:bg-stone-50 border-b border-stone-100 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-3 mt-auto pt-6">
          {isLoggedIn ? (
            <Link href={dashboardUrl!} onClick={() => setOpen(false)}
              className="w-full text-center flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--wine-gradient)" }}>
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
          ) : (
            <>
              <Link href={`/${lang}/login`} onClick={() => setOpen(false)}
                className="w-full text-center px-5 py-2.5 rounded-lg font-medium text-stone-700 border border-stone-300 hover:bg-stone-50 transition-colors">
                {nav.login}
              </Link>
              <Link href={`/${lang}/register`} onClick={() => setOpen(false)}
                className="w-full text-center px-5 py-2.5 rounded-lg font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--wine-gradient)" }}>
                {nav.register}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
