import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { WishlistManager } from "@/components/collector/wishlist-manager";
import { BookmarkPlus } from "lucide-react";

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/login`);

  const items = await db.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookmarkPlus className="w-7 h-7 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-stone-900">La mia Wishlist</h1>
          <p className="text-stone-500 text-sm mt-1">Vini che stai cercando</p>
        </div>
      </div>
      <WishlistManager initialItems={items} />
    </div>
  );
}
