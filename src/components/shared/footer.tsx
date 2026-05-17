import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";

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
    <footer className="mt-auto text-white/70" style={{ background: "var(--wine-card)" }}>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <Image src="/logo.png" alt="Wine Bank 24" width={130} height={65} className="h-14 w-auto object-contain bg-white rounded-xl px-3 py-1.5" />
            </div>
            <p className="text-sm leading-relaxed text-white/70 max-w-sm">
              {dict.footer.tagline}
            </p>
            {/* Social */}
            <div className="flex items-center gap-4 pt-1">
              <a href="https://instagram.com/winebank24" target="_blank" rel="noopener noreferrer"
                className="transition-colors text-sm hover:text-white" style={{ color: "#df071b" }}>
                Instagram
              </a>
              <a href="https://facebook.com/winebank24" target="_blank" rel="noopener noreferrer"
                className="transition-colors text-sm hover:text-white" style={{ color: "#df071b" }}>
                Facebook
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
              {en ? "Legal" : "Legale"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${lang}/termini`} className="text-white/70 hover:text-white transition-colors">
                  {dict.footer.terms}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/privacy`} className="text-white/70 hover:text-white transition-colors">
                  {dict.footer.privacy}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/cookie`} className="text-white/70 hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
              {en ? "Contacts" : "Contatti"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" style={{ color: "#df071b" }} />
                <a href="mailto:info@winebank24.eu" className="text-white/70 hover:text-white transition-colors">
                  info@winebank24.eu
                </a>
              </li>
              <li className="text-white/40 text-xs mt-2">
                {en ? "VAT:" : "P.IVA:"}{" "}
                <span className="text-white/60">{en ? "pending registration" : "in fase di registrazione"}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer + copyright */}
      <div style={{ borderTop: "1px solid var(--wine-border)", background: "var(--wine-bg)" }}>
        <div className="max-w-7xl mx-auto px-6 py-5 space-y-2">
          <p className="text-xs text-white/40 leading-relaxed">
            ⚠️ {dict.footer.disclaimer}{" "}
            {en
              ? "Collecting digital certificates does not constitute an investment activity. The value of collectibles may vary."
              : "L'acquisizione di certificati digitali non costituisce attività di investimento. Il valore dei beni da collezione può variare."}
          </p>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Wine Bank 24. {dict.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
