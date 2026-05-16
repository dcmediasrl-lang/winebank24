"use client";

import { useState } from "react";
import { Wine, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];      // imageGallery array
  fallbackUrl?: string;  // imageUrl cover fallback
  alt: string;
  className?: string;
}

export function NftImageGallery({ images, fallbackUrl, alt, className }: Props) {
  const all = images.length > 0 ? images : (fallbackUrl ? [fallbackUrl] : []);
  const [current, setCurrent] = useState(0);

  if (all.length === 0) {
    return (
      <div className={cn("flex items-center justify-center bg-stone-100", className)}>
        <Wine className="w-12 h-12 text-stone-300" />
      </div>
    );
  }

  const prev = () => setCurrent(i => (i - 1 + all.length) % all.length);
  const next = () => setCurrent(i => (i + 1) % all.length);

  return (
    <div className={cn("relative overflow-hidden bg-stone-100 group", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={all[current]}
        alt={`${alt} ${current + 1}`}
        className="w-full h-full object-cover transition-opacity duration-200"
      />

      {/* Navigation arrows — only if multiple images */}
      {all.length > 1 && (
        <>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {all.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={e => { e.stopPropagation(); setCurrent(i); }}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  i === current ? "bg-white" : "bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
