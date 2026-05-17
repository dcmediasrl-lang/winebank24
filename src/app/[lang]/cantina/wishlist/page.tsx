import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookmarkPlus, Wine } from "lucide-react";

export default async function CantinaWishlistPage() {
  const items = await db.wishlistItem.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookmarkPlus className="w-7 h-7 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Wishlist clienti</h1>
          <p className="text-stone-500 text-sm mt-1">
            Vini cercati dai collezionisti ({items.length} richieste)
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <BookmarkPlus className="w-12 h-12 mx-auto mb-4 text-stone-300" />
          <p className="text-lg">Nessuna richiesta disponibile al momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-base font-semibold leading-tight flex items-center gap-2">
                  <Wine className="w-4 h-4 text-amber-500 shrink-0" />
                  {item.wineName}
                </CardTitle>
                {item.cantina && (
                  <p className="text-xs text-stone-500">{item.cantina}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {item.vintage && (
                    <Badge variant="outline" className="text-xs">{item.vintage}</Badge>
                  )}
                  {item.grape && (
                    <Badge variant="secondary" className="text-xs">{item.grape}</Badge>
                  )}
                  {item.maxPrice && (
                    <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                      max € {Number(item.maxPrice).toFixed(2)}
                    </Badge>
                  )}
                </div>
                {item.notes && (
                  <p className="text-xs text-stone-500 line-clamp-2">{item.notes}</p>
                )}
                <p className="text-xs text-stone-400">
                  {new Date(item.createdAt).toLocaleDateString("it-IT")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
