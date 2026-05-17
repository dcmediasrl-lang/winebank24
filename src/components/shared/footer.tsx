import Link from "next/link";
import { Wine, Mail } from "lucide-react";

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
  const en = lang === "en";
  return (
    <footer className="bg-stone-950 text-stone-400 mt-auto">

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Wine className="w-6 h-6 text-amber-400" />
              <span className="text-stone-100 font-bold text-lg">Wine Bank 24</span>
            </div>
            <p className="text-sm leading-relaxed text-stone-400 max-w-sm">
              {dict.footer.tagline}
            </p>
            {/* Social */}
            <div className="flex items-center gap-4 pt-1">
              <a href="https://instagram.com/winebank24" target="_blank" rel="noopener noreferrer"
                className="hover:text-amber-400 transition-colors text-sm">
                Instagram
              </a>
              <a href="https://facebook.com/winebank24" target="_blank" rel="noopener noreferrer"
                className="hover:text-amber-400 transition-colors text-sm">
                Facebook
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-stone-200 font-semibold text-sm uppercase tracking-wide">
              {en ? "Legal" : "Legale"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${lang}/termini`} className="hover:text-amber-400 transition-colors">
                  {dict.footer.terms}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/privacy`} className="hover:text-amber-400 transition-colors">
                  {dict.footer.privacy}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/cookie`} className="hover:text-amber-400 transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div className="space-y-3">
            <h4 className="text-stone-200 font-semibold text-sm uppercase tracking-wide">
              {en ? "Contacts" : "Contatti"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="mailto:info@winebank24.eu" className="hover:text-amber-400 transition-colors">
                  info@winebank24.eu
                </a>
              </li>
              <li className="text-stone-500 text-xs mt-2">
                {en ? "VAT:" : "P.IVA:"}{" "}
                <span className="text-stone-400">{en ? "pending registration" : "in fase di registrazione"}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer + copyright */}
      <div className="border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-6 py-5 space-y-2">
          <p className="text-xs text-stone-500 leading-relaxed">
            ⚠️ {dict.footer.disclaimer}{" "}
            {en
              ? "Collecting digital certificates does not constitute an investment activity. The value of collectibles may vary."
              : "L'acquisizione di certificati digitali non costituisce attività di investimento. Il valore dei beni da collezione può variare."}
          </p>
          <p className="text-xs text-stone-600">
            © {new Date().getFullYear()} Wine Bank 24. {dict.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
