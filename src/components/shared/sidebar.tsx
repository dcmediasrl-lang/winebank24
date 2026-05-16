"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Gem, ShoppingCart, BarChart3,
  Settings, LogOut, Wine, Package, FileText, Shield, Tag
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

  const adminLinks = [
    { href: p("/admin"), label: dict.dashboard, icon: LayoutDashboard },
    { href: p("/admin/users"), label: dict.users, icon: Users },
    { href: p("/admin/cantine"), label: dict.wineries, icon: Wine },
    { href: p("/admin/nfts"), label: dict.nft_minting, icon: Gem },
    { href: p("/admin/transactions"), label: dict.transactions, icon: ShoppingCart },
    { href: p("/admin/blog"), label: dict.blog, icon: FileText },
    { href: p("/admin/settings"), label: dict.settings, icon: Settings },
  ];

  const cantinaLinks = [
    { href: p("/cantina"), label: dict.dashboard, icon: LayoutDashboard },
    { href: p("/cantina/nfts"), label: dict.my_nfts, icon: Gem },
    { href: p("/cantina/offerte"), label: dict.offerte, icon: Tag },
    { href: p("/cantina/reports"), label: dict.reports, icon: BarChart3 },
  ];

  const collectorLinks = [
    { href: p("/collector"), label: dict.dashboard, icon: LayoutDashboard },
    { href: p("/collector/portfolio"), label: dict.my_collection, icon: Package },
    { href: p("/marketplace"), label: dict.marketplace, icon: ShoppingCart },
    { href: p("/collector/offerte"), label: dict.offerte, icon: Tag },
    { href: p("/collector/reports"), label: dict.history, icon: BarChart3 },
    { href: p("/collector/settings"), label: dict.security, icon: Shield },
  ];

  const links = role === "ADMIN" ? adminLinks : role === "CANTINA" ? cantinaLinks : collectorLinks;
  const roleLabel = role === "ADMIN" ? dict.admin : role === "CANTINA" ? dict.winery : dict.collector;

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-stone-950 text-stone-100 px-4 py-6">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2 mb-1">
          <Wine className="w-6 h-6 text-amber-400" />
          <span className="font-bold text-lg tracking-tight">Wine Bank 24</span>
        </div>
        <div className="text-xs text-stone-400">{roleLabel}</div>
        <div className="text-sm text-stone-300 font-medium truncate mt-1">{userName}</div>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === href
                ? "bg-amber-500 text-stone-950 font-semibold"
                : "text-stone-300 hover:bg-stone-800 hover:text-stone-100"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: `/${lang}/login` })}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-400 hover:bg-stone-800 hover:text-red-400 transition-colors mt-4"
      >
        <LogOut className="w-4 h-4" />
        {dict.logout}
      </button>
    </aside>
  );
}
