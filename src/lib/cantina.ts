/**
 * Il badge "Verificata" mostrato ai collezionisti deve significare qualcosa
 * di concreto: prima era un interruttore libero, attivabile dall'admin anche
 * senza che la cantina avesse mai caricato la polizza assicurativa
 * obbligatoria (art. A.3 del contratto). Da qui in avanti il badge pubblico
 * richiede entrambe le condizioni — la spunta amministrativa resta un
 * giudizio separato (identità, affidabilità), ma non basta più da sola a
 * mostrare "Verificata" in pubblico.
 */
export function isCantinaPubliclyVerified(cantina: {
  isVerified: boolean;
  insuranceDocUrl: string | null;
}): boolean {
  return cantina.isVerified && !!cantina.insuranceDocUrl;
}
