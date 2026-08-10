import { LegalHeader } from "@/components/shared/legal-header";

export default async function TerminiPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <div className="min-h-screen bg-[var(--wine-bg)]" style={{ color: "white" }}>
      <LegalHeader lang={lang} />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Termini e Condizioni</h1>
          <p className="text-[var(--wine-muted)] text-sm">Ultimo aggiornamento: maggio 2026</p>
        </div>

        <div className="space-y-10 text-white/80 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Natura della Piattaforma</h2>
            <p>
              Wine Bank 24 è una piattaforma digitale dedicata al <strong>collezionismo di vini pregiati</strong>.
              Il servizio consente ai collezionisti di acquisire, detenere e cedere certificati digitali (NFT) che attestano
              la proprietà — totale o parziale — di bottiglie di vino fisiche custodite presso le cantine produttrici certificate.
            </p>
            <p className="mt-3 p-4 bg-[#231515] border border-[#993300] rounded-lg text-sm">
              <strong>Wine Bank 24 è progettata come piattaforma per il collezionismo e la compravendita di bottiglie fisiche.</strong>{" "}
              Non offre consulenza finanziaria, rendimenti, interessi o garanzie di rivalutazione. I certificati digitali
              documentano la proprietà di un bene fisico determinato e non sono emessi con finalità di raccolta di capitale,
              né attribuiscono diritti sui ricavi della piattaforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Definizioni</h2>
            <ul className="space-y-2 text-sm">
              <li><strong>Certificato Digitale (NFT):</strong> token non fungibile che rappresenta la proprietà di una bottiglia o quota di bottiglia come bene da collezione.</li>
              <li><strong>Cantina Certificata:</strong> produttore vinicolo verificato da Wine Bank 24, responsabile della custodia fisica del bene.</li>
              <li><strong>Collezionista:</strong> utente registrato che acquisisce certificati digitali a fini di collezione personale.</li>
              <li><strong>Co-proprietà:</strong> quota di proprietà di un bene collezionabile condivisa tra più collezionisti, analoga alla co-proprietà di opere d’arte o altri beni pregiati.</li>
              <li><strong>Cessione:</strong> trasferimento volontario di un certificato o quota tra collezionisti, liberamente concordato tra le parti.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Natura Giuridica dei Certificati</h2>
            <p>
              Ogni NFT rappresenta un <strong>titolo di proprietà digitale</strong> su un bene fisico (bottiglia di vino)
              detenuto in custodia dalla cantina certificata. I certificati di co-proprietà rappresentano una quota della
              proprietà del bene fisico, analoga alla co-proprietà di un’opera d’arte, e non conferiscono alcun diritto
              a rendimenti, dividendi, interessi o proventi finanziari di alcun tipo.
            </p>
            <p className="mt-3">
              L’eventuale variazione di valore del bene è connessa esclusivamente alle <strong>caratteristiche intrinseche
              del prodotto</strong> (annata, cantina, rarità, stato di conservazione) e non a fattori finanziari
              o di mercato regolamentato.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Finalità Esclusivamente Collezionistica</h2>
            <p>
              Wine Bank 24 <strong>non garantisce, non promette e non suggerisce</strong> alcun apprezzamento di valore
              derivante dall’acquisizione di certificati digitali. Qualsiasi variazione del prezzo di cessione tra
              collezionisti è determinata liberamente dalle parti, in modo analogo alla compravendita di qualsiasi
              altro bene da collezione (opere d’arte, orologi, vini in asta).
            </p>
            <p className="mt-3">
              L’utente dichiara espressamente di acquisire i certificati <strong>esclusivamente a fini di collezione</strong>
              e non con finalità di investimento finanziario.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Custodia del Bene Fisico</h2>
            <p>
              Le bottiglie fisiche restano nella custodia delle cantine certificate, che ne garantiscono la conservazione
              nelle condizioni ottimali previste per ogni tipologia di vino. Il collezionista che detiene il 100% della
              proprietà di una bottiglia può richiedere la consegna fisica del bene secondo le modalità previste
              dalla cantina di riferimento.
            </p>
            <p className="mt-3">
              In caso di co-proprietà, la bottiglia rimane custodita dalla cantina fino a eventuale riacquisto integrale
              da parte di un singolo collezionista, previo accordo tra tutti i co-proprietari.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Marketplace, Cessioni e Commissioni</h2>
            <p>
              La piattaforma offre uno spazio di scambio tra collezionisti per la cessione volontaria di certificati
              e quote di proprietà. Le transazioni avvengono tra collezionisti privati. Wine Bank 24 agisce esclusivamente
              come <strong>intermediario tecnico</strong> e non come controparte finanziaria.
            </p>

            <div className="mt-4 p-4 bg-[#1a0f0f] border border-[#993300]/50 rounded-xl space-y-4">
              <p className="text-sm font-bold text-white">6.1 — Struttura delle commissioni</p>
              <p className="text-sm">
                Tutte le commissioni applicate da Wine Bank 24 sono <strong className="text-white">a carico esclusivo
                dell&apos;acquirente</strong> e vengono <strong className="text-white">aggiunte al prezzo del certificato</strong> al
                momento del checkout. Il venditore (cantina o collezionista) riceve sempre l&apos;importo esatto del prezzo
                da lui indicato, senza deduzioni. Le commissioni appaiono come voci separate nel riepilogo d&apos;ordine.
              </p>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-white/80 mb-1">Vendita primaria (cantina → acquirente)</p>
                  <ul className="space-y-1 text-white/60 text-xs list-disc list-inside">
                    <li>Prezzo del certificato: importo indicato dalla cantina</li>
                    <li>+ Commissione di servizio Wine Bank 24: percentuale indicata nella scheda acquisto</li>
                    <li>= Totale addebitato all&apos;acquirente</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-white/80 mb-1">Vendita secondaria (collezionista → acquirente)</p>
                  <ul className="space-y-1 text-white/60 text-xs list-disc list-inside">
                    <li>Prezzo del certificato: importo indicato dal venditore</li>
                    <li>+ Commissione di servizio Wine Bank 24: percentuale indicata nella scheda acquisto</li>
                    <li>+ Royalty cantina originale: percentuale indicata nella scheda acquisto</li>
                    <li>= Totale addebitato all&apos;acquirente</li>
                  </ul>
                </div>
              </div>

              <p className="text-xs text-white/40">
                Le percentuali applicate sono indicate esplicitamente nella scheda prodotto e nel riepilogo
                d&apos;ordine prima di ogni acquisto. Wine Bank 24 si riserva il diritto di modificare le commissioni
                con preavviso di 30 giorni comunicato via email agli utenti registrati.
              </p>
            </div>

            <div className="mt-4 p-4 bg-[#1a0f0f] border border-white/10 rounded-xl text-sm">
              <p className="font-bold text-white mb-2">6.2 — Royalty cantina su cessioni secondarie</p>
              <p className="text-white/70">
                Le cantine certificate ricevono una royalty su ogni cessione secondaria del proprio certificato,
                a titolo di corrispettivo continuativo per la custodia, la conservazione e la certificazione del bene fisico.
                Tale royalty è determinata al momento dell&apos;emissione del certificato e resta invariata per tutta
                la vita dello stesso. L&apos;importo è sempre a carico dell&apos;acquirente finale.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Dichiarazioni dell’Utente</h2>
            <p>Registrandosi alla piattaforma, l’utente dichiara di:</p>
            <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
              <li>Acquisire i certificati digitali esclusivamente come beni da collezione</li>
              <li>Non avere aspettative di apprezzamento garantito del valore del bene</li>
              <li>Essere consapevole che il valore dei beni da collezione può variare</li>
              <li>Avere piena capacità giuridica di agire (maggiore età)</li>
              <li>Aver letto e accettato integralmente i presenti Termini e Condizioni</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Responsabilità</h2>
            <p>
              Wine Bank 24 non è responsabile per la qualità fisica dei vini, per danni derivanti da conservazione
              impropria da parte delle cantine, né per la variazione del valore di mercato dei beni da collezione.
              Le cantine certificate sono direttamente responsabili della custodia e dell’autenticità dei beni.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Legge Applicabile e Foro Competente</h2>
            <p>
              I presenti Termini sono regolati dalla <strong>legge italiana</strong>. Per qualsiasi controversia
              derivante dall’utilizzo della piattaforma è competente in via esclusiva il Foro di Milano,
              salvo diversa disposizione di legge a tutela del consumatore.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Modifiche ai Termini</h2>
            <p>
              Wine Bank 24 si riserva il diritto di modificare i presenti Termini in qualsiasi momento.
              Le modifiche saranno comunicate agli utenti registrati via email con un preavviso di 30 giorni.
              L’utilizzo continuato della piattaforma dopo tale periodo costituisce accettazione delle modifiche.
            </p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-[var(--wine-border)] text-center text-white/40 text-sm">
          <p>Wine Bank 24 — Piattaforma di collezionismo digitale per vini pregiati</p>
          <p className="mt-1">Per informazioni: <a href="mailto:info@winebank24.eu" className="text-amber-600 hover:underline">info@winebank24.eu</a></p>
        </div>
      </div>
    </div>
  );
}
