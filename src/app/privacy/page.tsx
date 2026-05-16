export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Privacy Policy</h1>
          <p className="text-stone-500 text-sm">Ultimo aggiornamento: maggio 2026 — Ai sensi del Regolamento UE 2016/679 (GDPR)</p>
        </div>

        <div className="space-y-10 text-stone-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">1. Titolare del Trattamento</h2>
            <p>
              Il titolare del trattamento dei dati personali è <strong>Wine Bank 24</strong>.
              Per qualsiasi richiesta relativa ai tuoi dati personali puoi contattarci all'indirizzo:
              <a href="mailto:privacy@winebank24.com" className="text-amber-600 hover:underline ml-1">privacy@winebank24.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">2. Dati Raccolti</h2>
            <p>Raccogliamo i seguenti dati personali:</p>
            <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
              <li><strong>Dati di registrazione:</strong> nome, indirizzo email, password cifrata</li>
              <li><strong>Dati di transazione:</strong> storico acquisti e cessioni di certificati digitali</li>
              <li><strong>Dati di pagamento:</strong> gestiti in modo sicuro da Stripe (non memorizziamo dati di carte)</li>
              <li><strong>Dati di navigazione:</strong> log di accesso, indirizzo IP (a fini di sicurezza)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">3. Finalità del Trattamento</h2>
            <p>I tuoi dati sono trattati per:</p>
            <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
              <li>Erogazione del servizio di marketplace per collezionisti</li>
              <li>Gestione dell'account e autenticazione</li>
              <li>Elaborazione delle transazioni di acquisto e cessione</li>
              <li>Comunicazioni relative al servizio (notifiche transazioni, aggiornamenti)</li>
              <li>Adempimenti legali e fiscali</li>
              <li>Sicurezza della piattaforma e prevenzione frodi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">4. Base Giuridica</h2>
            <p>Il trattamento è fondato su:</p>
            <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
              <li><strong>Esecuzione del contratto</strong> (art. 6.1.b GDPR): per erogare il servizio richiesto</li>
              <li><strong>Obbligo legale</strong> (art. 6.1.c GDPR): per adempimenti fiscali e normativi</li>
              <li><strong>Legittimo interesse</strong> (art. 6.1.f GDPR): per sicurezza e prevenzione frodi</li>
              <li><strong>Consenso</strong> (art. 6.1.a GDPR): per comunicazioni promozionali (opzionale)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">5. Conservazione dei Dati</h2>
            <p>
              I dati dell'account sono conservati per tutta la durata del rapporto contrattuale e per i 10 anni
              successivi alla cessazione, in ottemperanza agli obblighi fiscali italiani. I dati di navigazione
              sono conservati per un massimo di 12 mesi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">6. Condivisione dei Dati</h2>
            <p>I tuoi dati non sono venduti a terzi. Sono condivisi esclusivamente con:</p>
            <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
              <li><strong>Stripe Inc.</strong>: processore di pagamenti (privacy policy su stripe.com)</li>
              <li><strong>Supabase Inc.</strong>: provider del database (privacy policy su supabase.com)</li>
              <li><strong>Vercel Inc.</strong>: provider hosting (privacy policy su vercel.com)</li>
              <li><strong>Cantine certificate</strong>: limitatamente ai dati necessari per la consegna fisica dei beni</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">7. I Tuoi Diritti</h2>
            <p>Ai sensi del GDPR hai diritto a:</p>
            <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
              <li>Accedere ai tuoi dati personali</li>
              <li>Rettificare dati inesatti</li>
              <li>Cancellare i tuoi dati (diritto all'oblio)</li>
              <li>Limitare il trattamento</li>
              <li>Portabilità dei dati</li>
              <li>Opporti al trattamento per legittime finalità</li>
              <li>Revocare il consenso in qualsiasi momento</li>
            </ul>
            <p className="mt-3">
              Per esercitare i tuoi diritti scrivi a <a href="mailto:privacy@winebank24.com" className="text-amber-600 hover:underline">privacy@winebank24.com</a>.
              Hai inoltre il diritto di proporre reclamo al Garante per la Protezione dei Dati Personali (garante.it).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">8. Cookie</h2>
            <p>
              La piattaforma utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio
              (autenticazione, sicurezza). Non utilizziamo cookie di profilazione o pubblicitari di terze parti.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-stone-200 text-center text-stone-400 text-sm">
          <p>Wine Bank 24 — Piattaforma di collezionismo digitale per vini pregiati italiani</p>
          <p className="mt-1">Per informazioni: <a href="mailto:info@winebank24.com" className="text-amber-600 hover:underline">info@winebank24.com</a></p>
        </div>
      </div>
    </div>
  );
}
