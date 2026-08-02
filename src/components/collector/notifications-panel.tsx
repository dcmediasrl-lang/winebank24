"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Check, Trash2, Mail, Smartphone, Tag, ShoppingCart, TrendingUp } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface Prefs {
  inAppOffers: boolean; inAppSales: boolean; inAppPurchase: boolean;
  emailOffers: boolean; emailSales: boolean; emailPurchase: boolean;
}

function iconFor(type: string) {
  if (type.startsWith("OFFER")) return Tag;
  if (type === "NFT_SOLD") return TrendingUp;
  return ShoppingCart;
}

function timeAgo(iso: string, en: boolean) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return en ? "just now" : "ora";
  const m = Math.floor(s / 60); if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24); return `${d} ${en ? "d" : "g"}`;
}

export function NotificationsPanel({
  lang, initialNotifications, initialPrefs, basePath = "collector",
}: {
  lang: string;
  initialNotifications: Notification[];
  initialPrefs: Prefs;
  /** Sezione del pannello in cui vive la pagina: i link vengono riscritti di conseguenza */
  basePath?: "collector" | "cantina";
}) {
  const en = lang === "en";
  const router = useRouter();
  const [items, setItems] = useState(initialNotifications);
  const [prefs, setPrefs] = useState(initialPrefs);
  const [savingPref, setSavingPref] = useState(false);
  const unread = items.filter(i => !i.read).length;

  // Le notifiche salvano link "/collector/...": per la cantina puntano alle
  // pagine equivalenti del suo pannello (offerte, portfolio, reports esistono in entrambi)
  const resolveLink = (link: string) =>
    `/${lang}${basePath === "cantina" ? link.replace("/collector/", "/cantina/") : link}`;

  async function markAllRead() {
    setItems(items.map(i => ({ ...i, read: true })));
    await fetch("/api/collector/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    router.refresh();
  }
  async function clearRead() {
    setItems(items.filter(i => !i.read));
    await fetch("/api/collector/notifications", { method: "DELETE" });
    router.refresh();
  }
  async function openOne(n: Notification) {
    if (!n.read) {
      setItems(items.map(i => i.id === n.id ? { ...i, read: true } : i));
      fetch("/api/collector/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n.id }) });
    }
  }
  async function togglePref(key: keyof Prefs) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSavingPref(true);
    try {
      const res = await fetch("/api/user/notification-preferences", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setPrefs(prefs); // rollback
      toast.error(en ? "Error saving" : "Errore nel salvataggio");
    } finally {
      setSavingPref(false);
    }
  }

  const rows: { label: string; inApp: keyof Prefs; email: keyof Prefs }[] = [
    { label: en ? "Offers received / accepted" : "Offerte ricevute / accettate", inApp: "inAppOffers", email: "emailOffers" },
    { label: en ? "Your sales" : "Vendite dei tuoi certificati", inApp: "inAppSales", email: "emailSales" },
    { label: en ? "Purchases & minting" : "Acquisti e creazione NFT", inApp: "inAppPurchase", email: "emailPurchase" },
  ];

  return (
    <div className="space-y-8">
      {/* ── Lista notifiche ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            {en ? "Notifications" : "Notifiche"}
            {unread > 0 && (
              <span className="text-xs font-bold bg-[#df071b] text-white rounded-full px-2 py-0.5">{unread}</span>
            )}
          </h2>
          <div className="flex gap-3 text-xs">
            {unread > 0 && (
              <button onClick={markAllRead} className="inline-flex items-center gap-1 text-white/60 hover:text-white">
                <Check className="w-3.5 h-3.5" /> {en ? "Mark all read" : "Segna lette"}
              </button>
            )}
            {items.some(i => i.read) && (
              <button onClick={clearRead} className="inline-flex items-center gap-1 text-white/40 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" /> {en ? "Clear read" : "Pulisci lette"}
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-14 text-white/40 border border-[var(--wine-border)] rounded-xl">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{en ? "No notifications yet" : "Nessuna notifica"}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map(n => {
              const Icon = iconFor(n.type);
              const inner = (
                <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  n.read ? "border-[var(--wine-border)] bg-transparent" : "border-amber-500/30 bg-amber-500/5"
                }`}>
                  <div className={`shrink-0 mt-0.5 ${n.read ? "text-white/40" : "text-amber-400"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#df071b] shrink-0" />}
                      <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                    </div>
                    {n.body && <p className="text-xs text-white/60 mt-0.5">{n.body}</p>}
                  </div>
                  <span className="text-xs text-white/30 shrink-0">{timeAgo(n.createdAt, en)}</span>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={resolveLink(n.link)} onClick={() => openOne(n)}>{inner}</Link>
                  ) : (
                    <button className="w-full text-left" onClick={() => openOne(n)}>{inner}</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Gestione notifiche ── */}
      <section>
        <h2 className="text-lg font-bold text-white mb-1">{en ? "Notification settings" : "Gestione notifiche"}</h2>
        <p className="text-xs text-[var(--wine-muted)] mb-4">
          {en ? "Choose what to receive and on which channel." : "Scegli cosa ricevere e su quale canale."}
        </p>
        <div className="rounded-xl border border-[var(--wine-border)] overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-2.5 bg-[var(--wine-card)] text-xs font-semibold text-white/50 uppercase tracking-wide">
            <span>{en ? "Event" : "Evento"}</span>
            <span className="flex items-center gap-1 justify-center w-16"><Smartphone className="w-3.5 h-3.5" /> App</span>
            <span className="flex items-center gap-1 justify-center w-16"><Mail className="w-3.5 h-3.5" /> Email</span>
          </div>
          {rows.map((r, i) => (
            <div key={r.inApp} className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 ${i > 0 ? "border-t border-[var(--wine-border)]" : ""}`}>
              <span className="text-sm text-white/80">{r.label}</span>
              <Toggle on={prefs[r.inApp]} disabled={savingPref} onClick={() => togglePref(r.inApp)} />
              <Toggle on={prefs[r.email]} disabled={savingPref} onClick={() => togglePref(r.email)} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-16 flex justify-center`}
      aria-pressed={on}
    >
      <span className={`relative inline-block w-10 h-5.5 rounded-full transition-colors ${on ? "bg-green-600" : "bg-white/15"}`} style={{ height: "22px" }}>
        <span className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white transition-all ${on ? "left-[20px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
