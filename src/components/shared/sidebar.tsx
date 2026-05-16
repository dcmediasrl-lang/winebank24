"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Gem, ShoppingCart, BarChart3,
  Settings, LogOut, Wine, Flame, Package
} from "lucide-react";
type Role = "ADMIN" | "CANTINA" | "COLLECTOR";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Utenti", icon: Users },
  { href: "/admin/cantine", label: "Cantine", icon: Wine },
  { href: "/admin/nfts", label: "NFT & Minting", icon: Gem },
  { href: "/admin/transactions", label: "Transazioni", icon: ShoppingCart },
  { href: "/admin/settings", label: "Configurazione", icon: Settings },
];

const cantinaLinks = [
  { href: "/cantina", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cantina/collections", label: "Collezioni", icon: Wine },
  { href: "/cantina/nfts", label: "I miei NFT", icon: Gem },
  { href: "/cantina/reports", label: "Reportistica", icon: BarChart3 },
];

const collectorLinks = [
  { href: "/collector", label: "Dashboard", icon: LayoutDashboard },
  { href: "/collector/portfolio", label: "La mia Collezione", icon: Package },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingCart },
  { href: "/collector/reports", label: "Storico", icon: BarChart3 },
  { href: "/collector/settings", label: "Sicurezza", icon: Settings },
];

interface SidebarProps {
  role: Role;
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const links = role === "ADMIN" ? adminLinks : role === "CANTINA" ? cantinaLinks : collectorLinks;
  const roleLabel = role === "ADMIN" ? "Amministratore" : role === "CANTINA" ? "Cantina" : "Collezionista";

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
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-400 hover:bg-stone-800 hover:text-red-400 transition-colors mt-4"
      >
        <LogOut className="w-4 h-4" />
        Esci
      </button>
    </aside>
  );
}
