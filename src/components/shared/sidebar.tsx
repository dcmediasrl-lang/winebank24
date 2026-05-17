"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Gem, ShoppingCart, BarChart3,
  Settings, LogOut, Wine, Package, FileText, Shield, Tag,
  Menu, X, Heart, BookmarkPlus, Database,
} from "lucide-react";

type Role = "ADMIN" | "CANTINA" | "COLLECTOR";

type SidebarDict = {
  dashboard: string;
  my_collection: string;
  marketplace: string;
  history: string;
  security: string;
  collections: string;
  my_nfts: string;
  reports: string;
  users: string;
  wineries: string;
  nft_minting: string;
  transactions: string;
  settings: string;
  logout: string;
  admin: string;
  winery: string;
  collector: string;
  blog: string;
  offerte: string;
};

interface SidebarProps {
  role: Role;
  userName: string;
  lang: string;
  dict: SidebarDict;
}

export function Sidebar({ role, userName, lang, dict }: SidebarProps) {
  const pathname = usePathname();
  const p = (path: string) => `/${lang}${path}`;
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminLinks = [
    { href: p("/admin"), label: dict.dashboard, icon: LayoutDashboard },
    { href: p("/admin/users"), label: dict.users, icon: Users },
    { href: p("/admin/cantine"), label: dict.wineries, icon: Wine },
    { href: p("/admin/nfts"), label: dict.nft_minting, icon: Gem },
    { href: p("/admin/transactions"), label: dict.transactions, icon: ShoppingCart },
    { href: p("/admin/blog"), label: dict.blog, icon: FileText },
    { href: p("/admin/wine-db"), label: "Database Vini", icon: Database },
    { href: p("/admin/settings"), label: dict.settings, icon: Settings },
  ];

  const cantinaLinks = [
    { href: p("/cantina"), label: dict.dashboard, icon: LayoutDashboard },
    { href: p("/cantina/nfts"), label: dict.my_nfts, icon: Gem },
    { href: p("/cantina/offerte"), label: dict.offerte, icon: Tag },
    { href: p("/cantina/reports"), label: dict.reports, icon: BarChart3 },
    { href: p("/cantina/wishlist"), label: "Wishlist clienti", icon: BookmarkPlus },
  ];

  const collectorLinks = [
    { href: p("/collector"), label: dict.dashboard, icon: LayoutDashboard },
    { href: p("/collector/portfolio"), label: dict.my_collection, icon: Package },
    { href: p("/marketplace"), label: dict.marketplace, icon: ShoppingCart },
    { href: p("/collector/offerte"), label: dict.offerte, icon: Tag },
    { href: p("/collector/reports"), label: dict.history, icon: BarChart3 },
    { href: p("/collector/preferiti"), label: "Preferiti", icon: Heart },
    { href: p("/collector/wishlist"), label: "Wishlist", icon: BookmarkPlus },
    { href: p("/collector/settings"), label: dict.security, icon: Shield },
  ];

  const links = role === "ADMIN" ? adminLinks : role === "CANTINA" ? cantinaLinks : collectorLinks;
  const roleLabel = role === "ADMIN" ? dict.admin : role === "CANTINA" ? dict.winery : dict.collector;

  const navContent = (
    <>
      <div className="mb-8 px-2">
        <div className="mb-3">
          <Image src="/logo.png" alt="Wine Bank 24" width={120} height={60} className="h-12 w-auto object-contain bg-white rounded-xl px-2 py-1" priority />
        </div>
        <div className="text-xs text-[var(--wine-muted)]">{roleLabel}</div>
        <div className="text-sm text-white/80 font-medium truncate mt-1">{userName}</div>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === href
                ? "font-semibold text-white bg-[#993300]"
                : "text-white/70 hover:bg-[#231515] hover:text-white"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: `/${lang}/login` })}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--wine-muted)] hover:bg-[var(--wine-card-hover)] hover:text-[#df071b] transition-colors mt-4"
      >
        <LogOut className="w-4 h-4" />
        {dict.logout}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[var(--wine-card)] border-b border-[var(--wine-border)] flex items-center justify-between px-4 py-3">
        <Image src="/logo.png" alt="Wine Bank 24" width={90} height={36} className="h-8 w-auto object-contain bg-white rounded-lg px-2 py-0.5" priority />
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white/70 hover:text-white p-1"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        "lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-[var(--wine-card)] text-white px-4 py-6 flex flex-col transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-white/40 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[var(--wine-card)] text-white px-4 py-6 shrink-0">
        {navContent}
      </aside>
    </>
  );
}
