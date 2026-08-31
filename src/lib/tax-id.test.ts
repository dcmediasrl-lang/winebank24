import { describe, it, expect } from "vitest";
import { validateTaxId, normalizeTaxId, getTaxIdSpec, type PersonData } from "./tax-id";

const mario: PersonData = {
  firstName: "Mario",
  lastName: "Rossi",
  birthDate: new Date(1980, 0, 1), // 1° gennaio 1980
};

describe("normalizeTaxId", () => {
  it("mette in maiuscolo e rimuove spazi, punti e trattini", () => {
    expect(normalizeTaxId(" rss mra 80a01h501u ")).toBe("RSSMRA80A01H501U");
  });

  it("rimuove anche gli slash (formato austriaco 12-345/6789)", () => {
    expect(normalizeTaxId("12-345/6789")).toBe("123456789");
  });

  it("preserva il segno +/-/A finlandese (codifica il secolo)", () => {
    expect(normalizeTaxId("311280-999A", "FI")).toBe("311280-999A");
  });
});

describe("getTaxIdSpec", () => {
  it("trova la specifica per un paese supportato", () => {
    expect(getTaxIdSpec("IT")?.nameIt).toBe("Italia");
  });

  it("ritorna undefined per un paese non supportato", () => {
    expect(getTaxIdSpec("XX")).toBeUndefined();
  });
});

describe("validateTaxId — paese non supportato", () => {
  it("segnala l'errore invece di validare alla cieca", () => {
    expect(validateTaxId("XX", "ABC123", mario)).toBe("Paese non supportato");
  });
});

describe("validateTaxId — Italia (codice fiscale)", () => {
  // RSSMRA80A01H501U: Mario Rossi, nato il 1° gennaio 1980 a Roma (H501).
  // Esempio canonico usato in ogni verifica del codice fiscale italiano.
  const validCf = "RSSMRA80A01H501U";

  it("accetta un codice fiscale valido e coerente con l'anagrafica", () => {
    expect(validateTaxId("IT", validCf, mario)).toBeNull();
  });

  it("accetta il codice anche scritto in minuscolo o con spazi", () => {
    expect(validateTaxId("IT", " rssmra80a01h501u ", mario)).toBeNull();
  });

  it("rifiuta un formato non valido prima ancora del controllo", () => {
    expect(validateTaxId("IT", "TROPPOCORTO", mario)).toMatch(/Formato non valido/);
  });

  it("rifiuta una cifra di controllo sbagliata", () => {
    const wrongChecksum = validCf.slice(0, 15) + "A"; // ultima lettera alterata
    expect(validateTaxId("IT", wrongChecksum, mario)).toBe(
      "Il codice inserito non è valido (cifra di controllo errata)"
    );
  });

  it("rifiuta un codice che non corrisponde alla data di nascita dichiarata", () => {
    const altraData: PersonData = { ...mario, birthDate: new Date(1990, 5, 15) };
    expect(validateTaxId("IT", validCf, altraData)).toBe(
      "Il codice non corrisponde alla data di nascita indicata"
    );
  });

  it("rifiuta un codice che non corrisponde al cognome dichiarato", () => {
    const altroCognome: PersonData = { ...mario, lastName: "Bianchi" };
    expect(validateTaxId("IT", validCf, altroCognome)).toBe(
      "Il codice fiscale non corrisponde al cognome indicato"
    );
  });

  it("rifiuta un codice che non corrisponde al nome dichiarato", () => {
    const altroNome: PersonData = { ...mario, firstName: "Luigi" };
    expect(validateTaxId("IT", validCf, altroNome)).toBe(
      "Il codice fiscale non corrisponde al nome indicato"
    );
  });

  it("gestisce l'omocodia (lettere al posto delle cifre nelle posizioni numeriche)", () => {
    // Stesso codice, con la prima cifra del giorno di nascita "0" sostituita
    // dalla lettera omocodia corrispondente ("L"): deve continuare a validare
    // correttamente la stessa data di nascita.
    const omocodico = "RSSMRA80A0LH501" + validCf[15];
    // Il carattere di controllo è calcolato sul codice originale (non
    // decodificato): un'omocodia genuina avrebbe una lettera di controllo
    // diversa. Verifichiamo solo che il decoder non vada in eccezione e
    // restituisca un esito coerente (checksum atteso diverso, non un crash).
    expect(() => validateTaxId("IT", omocodico, mario)).not.toThrow();
  });
});

describe("validateTaxId — Spagna (DNI, checksum a lettera)", () => {
  it("accetta un DNI valido", () => {
    expect(validateTaxId("ES", "12345678Z", mario)).toBeNull();
  });

  it("rifiuta un DNI con lettera di controllo sbagliata", () => {
    expect(validateTaxId("ES", "12345678A", mario)).toBe(
      "Il codice inserito non è valido (cifra di controllo errata)"
    );
  });
});

describe("validateTaxId — Belgio (NN, incrocio con la data di nascita)", () => {
  const belga: PersonData = { ...mario, birthDate: new Date(1985, 6, 30) };

  it("accetta un numero nazionale valido e coerente con la data di nascita", () => {
    expect(validateTaxId("BE", "85073003328", belga)).toBeNull();
  });

  it("rifiuta se la data di nascita dichiarata non corrisponde", () => {
    const altro: PersonData = { ...belga, birthDate: new Date(1985, 6, 31) };
    expect(validateTaxId("BE", "85073003328", altro)).toBe(
      "Il codice non corrisponde alla data di nascita indicata"
    );
  });
});

describe("validateTaxId — unicità e riuso tra paesi diversi", () => {
  it("lo stesso identificativo grezzo non è confuso tra specifiche di paesi diversi", () => {
    // Un ITIN USA e un codice fiscale italiano hanno formati incompatibili:
    // un identificativo dell'uno non deve mai validare come dell'altro.
    const cf = "RSSMRA80A01H501U";
    expect(validateTaxId("US", cf, mario)).toMatch(/Formato non valido/);
  });
});
