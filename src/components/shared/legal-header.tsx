"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Header per le pagine legali (termini, privacy, cookie).
// Logo → home; "Indietro" riporta all'ultima pagina (dashboard compresa).
export function LegalHeader({ lang }: { lang: string }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href={`/${lang}`} className="flex items-center hover:opacity-80 transition-opacity">
          <Image src="/logo.svg" alt="Wine Bank 24" width={140} height={48} className="h-9 w-auto" priority />
        </Link>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-700 hover:text-[#A21C19] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </button>
      </div>
    </header>
  );
}
