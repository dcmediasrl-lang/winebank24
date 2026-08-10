import { getTaxIdSpec } from "@/lib/tax-id";
import { SUPPORT_EMAIL } from "@/lib/contatti";
import { Lock, Mail } from "lucide-react";

interface Props {
  lang: string;
  initial: {
    firstName: string;
    lastName: string;
    birthDate: string; // YYYY-MM-DD
    country: string;
    fiscalCode: string;
  };
}

/**
 * I dati anagrafici sono in sola lettura: una volta verificati non sono
 * modificabili dall'utente. Cambiare in autonomia codice fiscale o data di
 * nascita, senza riscontro documentale, vanificherebbe la verifica
 * dell'identità e della maggiore età. Le correzioni passano dal supporto.
 */
export function AnagraficaForm({ lang, initial }: Props) {
  const en = lang === "en";
  const spec = getTaxIdSpec(initial.country);
  const paese = spec ? (en ? spec.nameEn : spec.nameIt) : initial.country;
  const etichettaCodice = spec ? (en ? spec.labelEn : spec.labelIt) : (en ? "Tax code" : "Codice identificativo");

  const dataNascita = initial.birthDate
    ? new Date(initial.birthDate).toLocaleDateString(en ? "en-GB" : "it-IT")
    : "—";

  const campi: { etichetta: string; valore: string }[] = [
    { etichetta: en ? "First name" : "Nome", valore: initial.firstName || "—" },
    { etichetta: en ? "Last name" : "Cognome", valore: initial.lastName || "—" },
    { etichetta: en ? "Date of birth" : "Data di nascita", valore: dataNascita },
    { etichetta: en ? "Country" : "Paese", valore: paese || "—" },
    { etichetta: etichettaCodice, valore: initial.fiscalCode || "—" },
  ];

  return (
    <div className="max-w-xl space-y-5">
      <dl className="rounded-xl border border-[var(--wine-border)] overflow-hidden">
        {campi.map((c, i) => (
          <div
            key={c.etichetta}
            className={`grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-1 sm:gap-4 px-4 py-3 ${
              i > 0 ? "border-t border-[var(--wine-border)]" : ""
            }`}
          >
            <dt className="text-xs uppercase tracking-wide text-[var(--wine-muted)] sm:pt-0.5">
              {c.etichetta}
            </dt>
            <dd className="text-sm font-medium text-white">{c.valore}</dd>
          </div>
        ))}
      </dl>

      <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3.5">
        <Lock className="w-4 h-4 text-amber-400/90 shrink-0 mt-0.5" />
        <div className="text-sm text-white/70 leading-relaxed">
          <p className="font-semibold text-white/85 mb-1">
            {en ? "Verified details cannot be edited" : "I dati verificati non sono modificabili"}
          </p>
          <p>
            {en
              ? "These details were checked against your identification code when you registered. To correct them, write to us attaching an identity document."
              : "Questi dati sono stati verificati con il tuo codice identificativo al momento della registrazione. Per una correzione scrivici allegando un documento d'identità."}
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
              en ? "Request to correct personal details" : "Richiesta correzione dati anagrafici"
            )}`}
            className="inline-flex items-center gap-1.5 mt-2.5 text-amber-400 hover:text-amber-300 font-medium"
          >
            <Mail className="w-3.5 h-3.5" />
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
