import { requireSession } from "@/lib/require-session";
import { db } from "@/lib/db";
import { getNotificationPreferences } from "@/lib/notifications";
import { NotificationsPanel } from "@/components/collector/notifications-panel";

export default async function NotifichePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const session = await requireSession(lang);

  const [notifications, prefs] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getNotificationPreferences(session.user.id),
  ]);

  return (
    <div className="max-w-2xl">
      <NotificationsPanel
        lang={lang}
        initialNotifications={notifications.map(n => ({ ...n, createdAt: n.createdAt.toISOString() }))}
        initialPrefs={prefs}
      />
    </div>
  );
}
