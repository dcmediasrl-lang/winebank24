import { hasLocale } from "../dictionaries";
import { notFound } from "next/navigation";
import { LegalHeader } from "@/components/shared/legal-header";

export default async function CookiePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const en = lang === "en";

  return (
    <div className="min-h-screen bg-[var(--wine-bg)]" style={{ color: "white" }}>
      <LegalHeader lang={lang} />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Cookie Policy</h1>
          <p className="text-[var(--wine-muted)] text-sm">
            {en ? "Last updated: July 2026" : "Ultimo aggiornamento: luglio 2026"}
          </p>
        </div>

        <div className="space-y-8 text-white/80 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">{en ? "1. What are cookies" : "1. Cosa sono i cookie"}</h2>
            <p>
              {en
                ? "Cookies are small text files that websites save on your device to make the site work, remember your preferences and, with your consent, measure traffic and show relevant advertising."
                : "I cookie sono piccoli file di testo che i siti salvano sul tuo dispositivo per far funzionare il sito, ricordare le tue preferenze e, previo consenso, misurare il traffico e mostrare annunci pertinenti."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">{en ? "2. Cookies we use" : "2. Cookie che utilizziamo"}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[var(--wine-border)] text-left text-white">
                    <th className="py-2 pr-4">{en ? "Type" : "Tipologia"}</th>
                    <th className="py-2 pr-4">{en ? "Purpose" : "Finalità"}</th>
                    <th className="py-2">{en ? "Consent" : "Consenso"}</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  <tr className="border-b border-[var(--wine-border)]/40">
                    <td className="py-2 pr-4 font-medium text-white/90">{en ? "Technical" : "Tecnici"}</td>
                    <td className="py-2 pr-4">{en ? "Authentication, session, security. Essential for the site to work." : "Autenticazione, sessione, sicurezza. Indispensabili al funzionamento del sito."}</td>
                    <td className="py-2">{en ? "Not required" : "Non richiesto"}</td>
                  </tr>
                  <tr className="border-b border-[var(--wine-border)]/40">
                    <td className="py-2 pr-4 font-medium text-white/90">{en ? "Analytics" : "Analitici"}</td>
                    <td className="py-2 pr-4">{en ? "Aggregate traffic statistics (Google Analytics GA4)." : "Statistiche di traffico in forma aggregata (Google Analytics GA4)."}</td>
                    <td className="py-2">{en ? "Required" : "Richiesto"}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-white/90">{en ? "Advertising" : "Pubblicitari"}</td>
                    <td className="py-2 pr-4">{en ? "Relevant advertising (Google AdSense), when active." : "Annunci pertinenti (Google AdSense), quando attivi."}</td>
                    <td className="py-2">{en ? "Required" : "Richiesto"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">{en ? "3. Managing your consent" : "3. Gestione del consenso"}</h2>
            <p>
              {en
                ? "On your first visit a banner lets you accept or decline non-essential cookies. You can change your choice at any time by clearing your browser's site data, or manage cookies directly from your browser settings."
                : "Alla prima visita un banner ti consente di accettare o rifiutare i cookie non essenziali. Puoi modificare la tua scelta in qualsiasi momento cancellando i dati del sito dal browser, oppure gestire i cookie direttamente dalle impostazioni del browser."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">{en ? "4. Contact" : "4. Contatti"}</h2>
            <p>
              {en ? "For any question about this policy: " : "Per qualsiasi domanda su questa policy: "}
              <a href="mailto:privacy@winebank24.eu" className="text-amber-500 hover:underline">privacy@winebank24.eu</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
