import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { Home, Search } from "lucide-react";

/**
 * Pagina 404 nella lingua del percorso visitato, con logo e vie d'uscita.
 * La lingua arriva dall'intestazione impostata dal middleware, perché una
 * pagina non trovata non riceve i parametri di rotta.
 */
export default async function NotFound() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const lang = pathname.startsWith("/en") ? "en" : "it";
  const en = lang === "en";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center" style={{ background: "var(--wine-bg)" }}>
      <Link href={`/${lang}`} className="mb-10 hover:opacity-80 transition-opacity">
        <Image src="/logo.svg" alt="Wine Bank 24" width={200} height={72} className="h-14 w-auto" priority />
      </Link>

      <p className="text-6xl font-extrabold text-[#A21C19] mb-4">404</p>

      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 max-w-lg text-balance">
        {en ? "This page doesn't exist" : "Questa pagina non esiste"}
      </h1>

      <p className="text-[var(--wine-muted)] max-w-md leading-relaxed mb-9">
        {en
          ? "The address may be wrong, or the certificate you were looking for is no longer available."
          : "L'indirizzo potrebbe essere errato, oppure il certificato che cercavi non è più disponibile."}
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href={`/${lang}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--wine-gradient)" }}
        >
          <Home className="w-4 h-4" />
          {en ? "Back to home" : "Torna alla home"}
        </Link>
        <Link
          href={`/${lang}/marketplace`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-[var(--wine-border)] text-white/80 hover:text-white hover:border-white/40 transition-colors"
        >
          <Search className="w-4 h-4" />
          {en ? "Browse the collection" : "Sfoglia la collezione"}
        </Link>
      </div>
    </div>
  );
}
