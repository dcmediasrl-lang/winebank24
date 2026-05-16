import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Wine, Gem, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Wine className="w-6 h-6 text-amber-400" />
          <span className="font-bold text-lg">Wine Bank 24</span>
        </div>
        <div className="flex gap-3">
          <Link href="/marketplace" className={cn(buttonVariants({ variant: "ghost" }), "text-stone-300 hover:text-white")}>
            Marketplace
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "border-stone-600 text-stone-200 hover:bg-stone-800")}>
            Accedi
          </Link>
          <Link href="/register" className={cn(buttonVariants(), "bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold")}>
            Registrati
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center px-4 py-28">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-amber-400 text-sm mb-6">
          <Gem className="w-3.5 h-3.5" /> NFT sul vino · Blockchain Polygon
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
          Il vino italiano<br />
          <span className="text-amber-400">tokenizzato</span> su blockchain
        </h1>
        <p className="text-stone-400 text-xl max-w-2xl mx-auto mb-10">
          Acquista, colleziona e vendi NFT di bottiglie di vino pregiate. Ogni token rappresenta una bottiglia reale — richiedila fisicamente quando vuoi.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/marketplace" className={cn(buttonVariants({ size: "lg" }), "bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-8")}>
            Esplora il Marketplace
          </Link>
          <Link href="/register" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-stone-600 text-stone-200 hover:bg-stone-800 px-8")}>
            Sei una Cantina?
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-24 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: Wine, title: "Cantine", desc: "Minta NFT basati sulla tua produzione di bottiglie. Gestisci collezioni e vendite direttamente in piattaforma." },
          { icon: Gem, title: "Collezionisti", desc: "Acquista NFT di bottiglie rare. Colleziona, rivendi o richiedi la consegna fisica della bottiglia." },
          { icon: Shield, title: "Sicuro & Trasparente", desc: "Ogni NFT è registrato su blockchain Polygon. Proprietà verificabile, trasferimenti tracciati." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-stone-900 border border-stone-800 rounded-xl p-6">
            <Icon className="w-8 h-8 text-amber-400 mb-4" />
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-stone-400 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-stone-800 text-center py-6 text-stone-500 text-sm">
        © {new Date().getFullYear()} Wine Bank 24 — Tutti i diritti riservati
      </footer>
    </div>
  );
}
