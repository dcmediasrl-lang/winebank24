import { getDictionary, hasLocale } from "../dictionaries";
import { notFound } from "next/navigation";
import { LegalHeader } from "@/components/shared/legal-header";

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const en = lang === "en";

  return (
    <div className="min-h-screen bg-[var(--wine-bg)]">
      <LegalHeader lang={lang} />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">{en ? "Privacy Policy" : "Privacy Policy"}</h1>
          <p className="text-[var(--wine-muted)] text-sm">{en ? "Last updated: May 2026 — Pursuant to EU Regulation 2016/679 (GDPR)" : "Ultimo aggiornamento: maggio 2026 — Ai sensi del Regolamento UE 2016/679 (GDPR)"}</p>
        </div>
        <div className="space-y-10 text-white/80 leading-relaxed">
          {en ? (
            <>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">1. Data Controller</h2>
                <p>The data controller is <strong>Wine Bank 24</strong>. For any requests regarding your personal data, contact us at: <a href="mailto:privacy@winebank24.com" className="text-amber-600 hover:underline">privacy@winebank24.com</a></p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">2. Data Collected</h2>
                <p>We collect the following personal data:</p>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li><strong>Registration data:</strong> name, email address, encrypted password</li>
                  <li><strong>KYC data:</strong> first name, last name, date of birth, country of residence</li>
                  <li><strong>Transaction data:</strong> history of purchases and transfers of digital certificates</li>
                  <li><strong>Payment data:</strong> handled securely by Stripe (we do not store card data)</li>
                  <li><strong>Navigation data:</strong> access logs, IP address (for security purposes)</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">3. Purpose of Processing</h2>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li>Provision of the marketplace service for collectors</li>
                  <li>Account management and authentication</li>
                  <li>Processing purchase and transfer transactions</li>
                  <li>Service communications (transaction notifications, updates)</li>
                  <li>Legal and fiscal compliance</li>
                  <li>Platform security and fraud prevention</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">4. Legal Basis</h2>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li><strong>Contract performance</strong> (Art. 6.1.b GDPR): to provide the requested service</li>
                  <li><strong>Legal obligation</strong> (Art. 6.1.c GDPR): for tax and regulatory compliance</li>
                  <li><strong>Legitimate interest</strong> (Art. 6.1.f GDPR): for security and fraud prevention</li>
                  <li><strong>Consent</strong> (Art. 6.1.a GDPR): for promotional communications (optional)</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">5. Data Retention</h2>
                <p>Account data is retained for the duration of the contractual relationship and for 10 years thereafter, in compliance with Italian tax obligations. Navigation data is retained for a maximum of 12 months.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">6. Data Sharing</h2>
                <p>Your data is not sold to third parties. It is shared exclusively with:</p>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li><strong>Stripe Inc.</strong>: payment processor</li>
                  <li><strong>Supabase Inc.</strong>: database provider</li>
                  <li><strong>Vercel Inc.</strong>: hosting provider</li>
                  <li><strong>Certified wineries:</strong> limited to data necessary for physical delivery of goods</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">7. Your Rights</h2>
                <p>Under GDPR you have the right to: access, rectify, erase, restrict processing, data portability, object to processing, and withdraw consent at any time.</p>
                <p className="mt-3">Contact <a href="mailto:privacy@winebank24.com" className="text-amber-600 hover:underline">privacy@winebank24.com</a> to exercise your rights.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">8. Cookies</h2>
                <p>The platform uses only technical cookies necessary for the service (authentication, security). We do not use third-party profiling or advertising cookies.</p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">1. Titolare del Trattamento</h2>
                <p>Il titolare è <strong>Wine Bank 24</strong>. Contattaci a: <a href="mailto:privacy@winebank24.com" className="text-amber-600 hover:underline">privacy@winebank24.com</a></p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">2. Dati Raccolti</h2>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li><strong>Registrazione:</strong> nome, email, password cifrata, dati anagrafici KYC light</li>
                  <li><strong>Transazioni:</strong> storico acquisti e cessioni di certificati digitali</li>
                  <li><strong>Pagamento:</strong> gestiti da Stripe (non memorizziamo dati di carte)</li>
                  <li><strong>Navigazione:</strong> log di accesso, IP (sicurezza)</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">3. Finalità del Trattamento</h2>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li>Erogazione del servizio marketplace per collezionisti</li>
                  <li>Gestione account e autenticazione</li>
                  <li>Elaborazione transazioni</li>
                  <li>Comunicazioni di servizio</li>
                  <li>Adempimenti legali e fiscali</li>
                  <li>Sicurezza e prevenzione frodi</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">4. Base Giuridica</h2>
                <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                  <li><strong>Esecuzione del contratto</strong> (art. 6.1.b GDPR)</li>
                  <li><strong>Obbligo legale</strong> (art. 6.1.c GDPR)</li>
                  <li><strong>Legittimo interesse</strong> (art. 6.1.f GDPR)</li>
                  <li><strong>Consenso</strong> (art. 6.1.a GDPR): per comunicazioni promozionali</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">5. Conservazione</h2>
                <p>Dati account conservati per la durata del contratto + 10 anni (obblighi fiscali). Dati di navigazione max 12 mesi.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">6. Condivisione</h2>
                <p>Dati non venduti. Condivisi solo con: Stripe, Supabase, Vercel, cantine certificate.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">7. I Tuoi Diritti</h2>
                <p>Accesso, rettifica, cancellazione, limitazione, portabilità, opposizione, revoca consenso. Contatta: <a href="mailto:privacy@winebank24.com" className="text-amber-600 hover:underline">privacy@winebank24.com</a></p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-white mb-3">8. Cookie</h2>
                <p>Solo cookie tecnici necessari al funzionamento. Nessun cookie di profilazione.</p>
              </section>
            </>
          )}
        </div>
        <div className="mt-16 pt-8 border-t border-[var(--wine-border)] text-center text-white/40 text-sm">
          <p>Wine Bank 24 — {dict.footer.tagline}</p>
          <p className="mt-1"><a href="mailto:info@winebank24.com" className="text-amber-600 hover:underline">info@winebank24.com</a></p>
        </div>
      </div>
    </div>
  );
}
