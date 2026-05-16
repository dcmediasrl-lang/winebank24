"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wine, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { CONTRACT_CANTINA_VERSION } from "@/lib/contracts";

export default function CantinaContrattoPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = use(params);
  const router = useRouter();
  const [checks, setChecks] = useState({ c1: false, c2: false, c3: false, c4: false, c5: false });
  const [loading, setLoading] = useState(false);

  const allChecked = Object.values(checks).every(Boolean);
  const toggle = (k: keyof typeof checks) => setChecks(p => ({ ...p, [k]: !p[k] }));

  async function accept() {
    if (!allChecked) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cantina/accept-contract", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Contratto accettato. Benvenuto su Wine Bank 24!");
      router.push(`/${lang}/cantina`);
      router.refresh();
    } catch {
      toast.error("Errore durante l'accettazione. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Contratto Creator — Wine Bank 24</h1>
          <p className="text-stone-500 text-sm">
            Versione {CONTRACT_CANTINA_VERSION} · Leggi con attenzione prima di procedere
          </p>
        </div>
      </div>

      {/* Alert box */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 leading-relaxed">
          Il presente contratto regola il rapporto tra la tua cantina ("<strong>Creator</strong>") e
          la piattaforma Wine Bank 24 ("<strong>Piattaforma</strong>"). L'accettazione è obbligatoria
          per operare sulla piattaforma. Conserva una copia di questo documento.
        </p>
      </div>

      {/* Contract body */}
      <div className="space-y-8 text-stone-700 leading-relaxed text-sm">

        {/* Natura giuridica */}
        <section className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="bg-stone-900 text-white px-5 py-3">
            <h2 className="font-semibold">Natura giuridica del rapporto</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p>Il presente contratto ha natura di:</p>
            <ul className="space-y-2 pl-4">
              <li className="flex gap-2"><span className="text-amber-600 font-bold shrink-0">①</span><span><strong>Custodia qualificata</strong> — il Creator si obbliga a custodire il bene fisico (bottiglia) in conformità agli standard stabiliti dalla Piattaforma, assumendo le responsabilità di un depositario professionale ai sensi degli artt. 1766 ss. c.c.</span></li>
              <li className="flex gap-2"><span className="text-amber-600 font-bold shrink-0">②</span><span><strong>Mandato con rappresentanza limitata</strong> — la Piattaforma agisce come intermediario tecnico per conto del Creator nella gestione dei certificati digitali, nei limiti espressamente previsti dal presente contratto.</span></li>
              <li className="flex gap-2"><span className="text-amber-600 font-bold shrink-0">③</span><span><strong>Vincolo di indisponibilità del bene</strong> — dal momento dell'iscrizione del certificato digitale nella piattaforma, il bene fisico sottostante è gravato da un vincolo contrattuale di indisponibilità fino al completamento della procedura di liquidazione.</span></li>
            </ul>
          </div>
        </section>

        {/* A1 - Identificazione bene */}
        <section className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="bg-stone-50 border-b border-stone-200 px-5 py-3">
            <h2 className="font-semibold text-stone-900">A.1 — Identificazione del Bene</h2>
          </div>
          <div className="px-5 py-4 space-y-2">
            <p>Ogni bene fisico (bottiglia) oggetto di certificazione digitale deve essere identificato in modo univoco e non ambiguo attraverso il form di inserimento prodotto, con indicazione obbligatoria di:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Nome del vino, denominazione di origine e annata</li>
              <li>Numero di bottiglia/lotto seriale univoco</li>
              <li>Cantina di custodia certificata (indirizzo fisico)</li>
              <li><strong>Fotografia della bottiglia fisica</strong> — elemento obbligatorio, non derogabile</li>
              <li>Descrizione delle condizioni di conservazione</li>
            </ul>
            <div className="bg-stone-100 rounded-lg p-3 text-xs text-stone-600 font-mono mt-2">
              Esempio: "Sassicaia 2015 — Tenuta San Guido — Lotto 0042/500 — conservata in cantina a temperatura controllata 14°C, umidità 70%, cantina certificata Wine Bank 24"
            </div>
          </div>
        </section>

        {/* A2 - Vincolo di indisponibilità */}
        <section className="border border-red-200 rounded-xl overflow-hidden">
          <div className="bg-red-600 text-white px-5 py-3">
            <h2 className="font-semibold">A.2 — Vincolo di Indisponibilità del Bene ⚠️</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="font-medium text-stone-900">
              Dal momento dell'emissione del certificato digitale e fino al completamento della procedura di liquidazione, il Creator <strong className="text-red-700">non può</strong>:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Vendere la bottiglia fisica",
                "Spostare o trasferire il bene",
                "Dare il bene in pegno o in garanzia",
                "Cedere a qualsiasi titolo il bene",
                "Modificare le condizioni di custodia senza autorizzazione",
                "Aprire o consumare la bottiglia",
              ].map(item => (
                <div key={item} className="flex gap-2 bg-red-50 rounded-lg px-3 py-2 text-xs">
                  <span className="text-red-600 font-bold shrink-0">✗</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-sm">
              Qualsiasi atto dispositivo sul bene fisico in violazione del presente vincolo è inefficace nei confronti della Piattaforma e dei titolari di certificati digitali, e costituisce inadempimento grave con le conseguenze di cui all'art. A.5.
            </p>
          </div>
        </section>

        {/* A3 - Obbligo di custodia */}
        <section className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="bg-stone-50 border-b border-stone-200 px-5 py-3">
            <h2 className="font-semibold text-stone-900">A.3 — Obblighi di Custodia</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p>Il Creator si obbliga a:</p>
            <ul className="space-y-2 pl-2">
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span><strong>Conservazione a norma:</strong> temperatura 10–16°C, umidità 60–80%, assenza di vibrazioni e luce diretta, posizione orizzontale, conformità alle norme UNI EN ISO 9000 per la conservazione di prodotti enologici pregiati.</span></li>
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span><strong>Assicurazione obbligatoria:</strong> polizza All Risks per il valore totale dei beni certificati, con la Piattaforma e i titolari di certificati come beneficiari in caso di sinistro. La polizza deve essere presentata alla Piattaforma entro 30 giorni dall'iscrizione e rinnovata annualmente.</span></li>
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span><strong>Audit annuale:</strong> il Creator si sottopone a verifica annuale dello stato di conservazione dei beni, condotta da ispettore accreditato dalla Piattaforma, a proprie spese.</span></li>
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span><strong>Accesso ispettivo:</strong> la Piattaforma ha diritto di accesso ispettivo con preavviso di 48 ore, in qualsiasi momento, per verificare lo stato dei beni. In caso di emergenza (sinistro, segnalazione di irregolarità), l'accesso è immediato.</span></li>
              <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span><strong>Notifica immediata:</strong> il Creator comunica alla Piattaforma entro 24 ore qualsiasi evento che possa pregiudicare lo stato di conservazione del bene (allagamento, furto, incendio, guasto impianto).</span></li>
            </ul>
          </div>
        </section>

        {/* A4 - Liquidazione */}
        <section className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="bg-stone-50 border-b border-stone-200 px-5 py-3">
            <h2 className="font-semibold text-stone-900">A.4 — Clausola di Liquidazione</h2>
          </div>
          <div className="px-5 py-4 space-y-2">
            <p>La liquidazione del certificato digitale (ritiro fisico della bottiglia da parte del titolare) è regolata dalla seguente procedura:</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Il titolare del 100% della proprietà (certificato intero o tutte le quote di co-proprietà) presenta richiesta di liquidazione tramite piattaforma.</li>
              <li>La Piattaforma notifica la richiesta al Creator entro 24 ore.</li>
              <li>Il Creator ha 5 giorni lavorativi per confermare la disponibilità del bene e concordare le modalità di consegna.</li>
              <li>La consegna avviene entro 15 giorni lavorativi dalla conferma, a spese del richiedente.</li>
              <li>Al momento della consegna verificata, il certificato digitale viene invalidato e il vincolo di indisponibilità viene rimosso.</li>
            </ol>
            <p className="text-xs text-stone-500 mt-2">
              In caso di co-proprietà frazionata, la liquidazione è possibile solo previo accordo unanime di tutti i co-proprietari o riacquisto integrale da parte di uno di essi.
            </p>
          </div>
        </section>

        {/* A5 - Clausola penale */}
        <section className="border border-red-200 rounded-xl overflow-hidden">
          <div className="bg-red-700 text-white px-5 py-3">
            <h2 className="font-semibold">A.5 — Clausola Penale</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="font-medium text-stone-900">
              In caso di violazione del vincolo di indisponibilità (vendita, cessione, pegno o qualsiasi atto dispositivo sul bene fisico al di fuori della procedura di liquidazione), il Creator è soggetto a:
            </p>
            <div className="space-y-2">
              <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <span className="text-red-700 font-bold text-lg shrink-0">1.</span>
                <div>
                  <p className="font-semibold text-red-800">Penale del 200% del valore stimato del bene</p>
                  <p className="text-xs text-red-700">Calcolato al valore di mercato al momento dell'accertamento della violazione. Dovuta immediatamente, senza necessità di messa in mora.</p>
                </div>
              </div>
              <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <span className="text-red-700 font-bold text-lg shrink-0">2.</span>
                <div>
                  <p className="font-semibold text-red-800">Escussione immediata della polizza assicurativa</p>
                  <p className="text-xs text-red-700">La Piattaforma è autorizzata ad agire direttamente nei confronti dell'assicuratore per conto dei titolari di certificati.</p>
                </div>
              </div>
              <div className="flex gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <span className="text-red-700 font-bold text-lg shrink-0">3.</span>
                <div>
                  <p className="font-semibold text-red-800">Risoluzione immediata del contratto</p>
                  <p className="text-xs text-red-700">Sospensione immediata dell'account, rimozione di tutti i certificati attivi, esclusione permanente dalla piattaforma. Salvo il diritto al risarcimento del maggior danno.</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-stone-500">
              Le parti concordano che la penale è determinata in funzione preventiva e non costituisce liquidazione forfettaria del danno, fermo restando il diritto della Piattaforma e dei titolari di certificati al risarcimento del danno ulteriore.
            </p>
          </div>
        </section>

        {/* A6 - Legge applicabile */}
        <section className="border border-stone-200 rounded-xl overflow-hidden">
          <div className="bg-stone-50 border-b border-stone-200 px-5 py-3">
            <h2 className="font-semibold text-stone-900">A.6 — Legge Applicabile e Foro</h2>
          </div>
          <div className="px-5 py-4">
            <p>Il presente contratto è regolato dalla <strong>legge italiana</strong>. Per qualsiasi controversia è competente in via esclusiva il <strong>Tribunale di Milano</strong>, salvo diversa disposizione di legge inderogabile.</p>
          </div>
        </section>

      </div>

      {/* Acceptance checkboxes */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-stone-900">Dichiarazioni di accettazione</h3>
        <p className="text-sm text-stone-500">Devi selezionare tutte le dichiarazioni per procedere:</p>

        {([
          { key: "c1", text: "Ho letto integralmente il contratto e ne comprendo il contenuto." },
          { key: "c2", text: "Accetto il vincolo di indisponibilità del bene fisico per tutta la durata della certificazione digitale." },
          { key: "c3", text: "Mi impegno a rispettare gli obblighi di custodia (conservazione a norma, assicurazione, audit annuale, accesso ispettivo)." },
          { key: "c4", text: "Prendo atto della clausola penale del 200% per violazione del vincolo di indisponibilità e dell'immediata risoluzione del contratto." },
          { key: "c5", text: "Autorizzo Wine Bank 24 ad agire come mandatario con rappresentanza limitata per la gestione dei certificati digitali relativi ai miei prodotti." },
        ] as { key: keyof typeof checks; text: string }[]).map(({ key, text }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer group">
            <div className={`w-5 h-5 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
              checks[key] ? "bg-amber-500 border-amber-500" : "border-stone-300 group-hover:border-amber-400"
            }`} onClick={() => toggle(key)}>
              {checks[key] && <CheckCircle className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-stone-700 leading-relaxed">{text}</span>
          </label>
        ))}

        <Button
          onClick={accept}
          disabled={!allChecked || loading}
          className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold py-3 text-base disabled:opacity-40"
        >
          {loading ? "Registrazione accettazione in corso..." : "Accetto il contratto e attivo il mio account Creator"}
        </Button>

        <p className="text-xs text-stone-400 text-center">
          L'accettazione viene registrata con timestamp e IP. Versione contratto: {CONTRACT_CANTINA_VERSION}
        </p>
      </div>
    </div>
  );
}
