import Link from "next/link";
import { Wine } from "lucide-react";

type Dict = {
  footer: {
    tagline: string;
    terms: string;
    privacy: string;
    contacts: string;
    disclaimer: string;
    rights: string;
  };
};

export function Footer({ dict, lang }: { dict: Dict; lang: string }) {
  return (
    <footer className="bg-stone-950 text-stone-400 py-10 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Wine className="w-5 h-5 text-amber-400" />
            <span className="text-stone-200 font-semibold">Wine Bank 24</span>
            <span className="text-xs ml-2">{dict.footer.tagline}</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href={`/${lang}/termini`} className="hover:text-amber-400 transition-colors">{dict.footer.terms}</Link>
            <Link href={`/${lang}/privacy`} className="hover:text-amber-400 transition-colors">{dict.footer.privacy}</Link>
            <a href="mailto:info@winebank24.com" className="hover:text-amber-400 transition-colors">{dict.footer.contacts}</a>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-stone-800 text-center text-xs text-stone-600">
          <p>{dict.footer.disclaimer}</p>
          <p className="mt-1">© {new Date().getFullYear()} Wine Bank 24. {dict.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
