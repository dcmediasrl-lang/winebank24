import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Sessione garantita per le pagine dell'area riservata.
 *
 * Il layout reindirizza già chi non è autenticato, ma in App Router il layout
 * e la pagina vengono generati **in parallelo**: senza questo controllo la
 * pagina proverebbe comunque a leggere una sessione nulla e solleverebbe
 * un'eccezione a ogni visita anonima. L'utente vedrebbe il redirect, ma il
 * server registrerebbe un errore per ogni richiesta.
 *
 * Restituisce una sessione non nulla, così le pagine non hanno bisogno
 * dell'asserzione `session!`.
 */
export async function requireSession(lang: string = "it") {
  const session = await auth();
  if (!session?.user?.id) redirect(`/${lang}/login`);
  return session;
}
