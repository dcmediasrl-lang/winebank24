"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FavoriteButtonProps {
  nftId: string;
  initialFavorited: boolean;
}

export function FavoriteButton({ nftId, initialFavorited }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const method = favorited ? "DELETE" : "POST";
      const res = await fetch(`/api/collector/favorites/${nftId}`, { method });
      if (res.ok) {
        setFavorited(!favorited);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={loading}
      onClick={toggle}
      className="h-8 w-8 rounded-full hover:bg-red-50"
      aria-label={favorited ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          favorited ? "fill-red-500 text-red-500" : "text-stone-400 hover:text-red-400"
        }`}
      />
    </Button>
  );
}
