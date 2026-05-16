import Link from "next/link";
import { Wine } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-400 py-10 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Wine className="w-5 h-5 text-amber-400" />
            <span className="text-stone-200 font-semibold">Wine Bank 24</span>
            <span className="text-xs ml-2">Piattaforma di collezionismo digitale per vini pregiati italiani</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/termini" className="hover:text-amber-400 transition-colors">Termini e Condizioni</Link>
            <Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy Policy</Link>
            <a href="mailto:info@winebank24.com" className="hover:text-amber-400 transition-colors">Contatti</a>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-stone-800 text-center text-xs text-stone-600">
          <p>Wine Bank 24 è una piattaforma di collezionismo. I certificati digitali (NFT) non costituiscono strumenti finanziari ai sensi della Direttiva MiFID II.</p>
          <p className="mt-1">© {new Date().getFullYear()} Wine Bank 24. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
}
