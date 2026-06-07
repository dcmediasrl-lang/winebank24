"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
}

export function HomeNav({ lang, nav, dashboardUrl, userName }: HomeNavProps) {
  const [open, setOpen] = useState(false);
  const isLoggedIn = !!dashboardUrl;

  const navLinks = [
    { href: `/${lang}/marketplace`, label: nav.marketplace },
    { href: `/${lang}/blog`, label: nav.blog },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md flex items-center justify-between px-6 sm:px-10 py-4"
      style={{ background: "var(--wine-header)", borderBottom: "1px solid var(--wine-border)" }}
    >
      {/* Logo */}
      <Link href={`/${lang}`}>
        <Image
          src="/logo.png"
          alt="Wine Bank 24"
          width={100}
          height={50}
          className="h-10 w-auto object-contain bg-white rounded-lg px-2 py-1"
          priority
        />
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-3">
        {navLinks.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="font-medium px-3 py-2 transition-colors text-white/70 hover:text-white uppercase text-sm tracking-wide"
          >
            {l.label}
          </Link>
        ))}

        {isLoggedIn ? (
          <>
            {/* User name chip */}
            {userName && (
              <span className="text-xs text-white/50 px-2 hidden lg:block truncate max-w-[140px]">
                {userName}
              </span>
            )}
            {/* Dashboard button */}
            <Link
              href={dashboardUrl!}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-white transition-opacity hover:opacity-90 text-sm"
              style={{ background: "var(--wine-gradient)" }}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link
              href={`/${lang}/login`}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium transition-colors text-white text-sm"
              style={{ border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <LogIn className="w-4 h-4" />
              {nav.login}
            </Link>
            <Link
              href={`/${lang}/register`}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-white transition-opacity hover:opacity-90 text-sm"
              style={{ background: "var(--wine-gradient)" }}
            >
              <UserPlus className="w-4 h-4" />
              {nav.register}
            </Link>
          </>
        )}

        {/* Lang switcher */}
        <Link
          href={lang === "en" ? "/it" : "/en"}
          className="text-xs hover:text-white transition-colors ml-1"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {lang === "en" ? "🇮🇹 IT" : "🇬🇧 EN"}
        </Link>
      </div>

      {/* Mobile: lang + hamburger */}
      <div className="flex md:hidden items-center gap-3">
        <Link
          href={lang === "en" ? "/it" : "/en"}
          className="text-xs hover:text-white transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {lang === "en" ? "🇮🇹 IT" : "🇬🇧 EN"}
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="hover:text-white p-1 transition-colors"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-72 flex flex-col p-6 shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        style={{ background: "var(--wine-card)", borderLeft: "1px solid var(--wine-border)" }}
      >
        <div className="flex items-center justify-between mb-8">
          <Image
            src="/logo.png"
            alt="Wine Bank 24"
            width={90}
            height={45}
            className="h-9 w-auto object-contain bg-white rounded-lg px-2 py-1"
          />
          <button
            onClick={() => setOpen(false)}
            className="hover:text-white transition-colors"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User greeting if logged in */}
        {isLoggedIn && userName && (
          <div className="mb-4 px-1 pb-4 border-b border-[var(--wine-border)]">
            <p className="text-xs text-white/40 uppercase tracking-wide">Connesso come</p>
            <p className="text-white font-semibold text-sm mt-0.5 truncate">{userName}</p>
          </div>
        )}

        <nav className="flex flex-col gap-1 flex-1">
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 px-2 font-medium transition-colors uppercase text-sm tracking-wider rounded-lg hover:bg-white/5"
              style={{ color: "rgba(255,255,255,0.8)", borderBottom: "1px solid var(--wine-border)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-3 mt-auto pt-6">
          {isLoggedIn ? (
            <Link
              href={dashboardUrl!}
              onClick={() => setOpen(false)}
              className="w-full text-center flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--wine-gradient)" }}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href={`/${lang}/login`}
                onClick={() => setOpen(false)}
                className="w-full text-center px-5 py-2.5 rounded-lg font-medium transition-colors text-white"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                {nav.login}
              </Link>
              <Link
                href={`/${lang}/register`}
                onClick={() => setOpen(false)}
                className="w-full text-center px-5 py-2.5 rounded-lg font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--wine-gradient)" }}
              >
                {nav.register}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
