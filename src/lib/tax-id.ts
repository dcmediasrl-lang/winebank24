// Validazione dei codici identificativi fiscali per paese.
// Formati e algoritmi dalle country sheet TIN ufficiali della Commissione
// Europea e dalle specifiche IRS per l'ITIN statunitense.
//
// Livelli di verifica per paese:
// - structure : formato (regex) — sempre
// - checksum  : cifra/lettera di controllo ufficiale — dove esiste
// - birthDate : il codice contiene la data di nascita → confronto automatico
// - fullMatch : il codice contiene anche nome e cognome (solo Italia)

export interface PersonData {
  firstName: string;
  lastName: string;
  birthDate: Date;
}

export interface TaxIdSpec {
  country: string;
  nameIt: string;
  nameEn: string;
  labelIt: string;
  labelEn: string;
  placeholder: string;
  regex: RegExp;
  /** Returns an error string (Italian) or null if valid */
  check?: (id: string, p: PersonData) => string | null;
  /** What the automatic cross-check covers */
  crossCheck: "fullMatch" | "birthDate" | "checksum" | "structure";
}

/** Normalizza: maiuscole, senza spazi, punti, trattini o slash.
 *  In Finlandia il segno +/-/A codifica il secolo e va preservato. */
export function normalizeTaxId(raw: string, country?: string): string {
  const up = raw.toUpperCase().trim();
  if (country === "FI") return up.replace(/[\s.]/g, "");
  return up.replace(/[\s.\-/]/g, "");
}

const ERR_CHECKSUM = "Il codice inserito non è valido (cifra di controllo errata)";
const ERR_BIRTH = "Il codice non corrisponde alla data di nascita indicata";

function digits(s: string): number[] {
  return s.split("").map(Number);
}

/** Confronta data estratta (y a 2 cifre + secolo dedotto, m, d) con la data di nascita */
function birthMatches(p: PersonData, year: number, month: number, day: number): boolean {
  return (
    p.birthDate.getFullYear() === year &&
    p.birthDate.getMonth() + 1 === month &&
    p.birthDate.getDate() === day
  );
}

/** Deducendo il secolo: chi si registra è nato tra il 1900 e oggi */
function fullYear(yy: number): number {
  const nowYY = new Date().getFullYear() % 100;
  return yy <= nowYY ? 2000 + yy : 1900 + yy;
}

// ─── Italia — codice fiscale ────────────────────────────────────────────────

const CF_MONTHS = "ABCDEHLMPRST"; // A=gen ... T=dic
const CF_OMOCODIA: Record<string, string> = {
  L: "0", M: "1", N: "2", P: "3", Q: "4", R: "5", S: "6", T: "7", U: "8", V: "9",
};
const CF_ODD: Record<string, number> = {};
const CF_EVEN: Record<string, number> = {};
{
  const oddVals = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];
  for (let i = 0; i < 26; i++) {
    const ch = String.fromCharCode(65 + i);
    CF_ODD[ch] = oddVals[i];
    CF_EVEN[ch] = i;
    CF_ODD[String(i)] = i < 10 ? oddVals[i] : 0;
    CF_EVEN[String(i)] = i;
  }
  for (let d = 0; d <= 9; d++) {
    CF_ODD[String(d)] = oddVals[d];
    CF_EVEN[String(d)] = d;
  }
}

function cfNameCode(s: string, isFirstName: boolean): string {
  const clean = s.toUpperCase().replace(/[^A-Z]/g, "");
  const cons = clean.replace(/[AEIOU]/g, "");
  const vows = clean.replace(/[^AEIOU]/g, "");
  let picked: string;
  if (isFirstName && cons.length >= 4) {
    picked = cons[0] + cons[2] + cons[3];
  } else {
    picked = (cons + vows + "XXX").slice(0, 3);
  }
  return picked;
}

function validateCodiceFiscale(id: string, p: PersonData): string | null {
  // Riporta le lettere omocodia a cifre nelle posizioni numeriche
  const chars = id.split("");
  const numericPos = [6, 7, 9, 10, 12, 13, 14];
  for (const i of numericPos) {
    if (/[A-Z]/.test(chars[i])) {
      const d = CF_OMOCODIA[chars[i]];
      if (!d) return "Il codice fiscale inserito non è valido";
      chars[i] = d;
    }
  }
  const cf = chars.join("");

  // Carattere di controllo (calcolato sul codice originale, non decodificato)
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += i % 2 === 0 ? CF_ODD[id[i]] : CF_EVEN[id[i]];
  }
  if (String.fromCharCode(65 + (sum % 26)) !== id[15]) return ERR_CHECKSUM;

  // Data di nascita (giorno +40 per le donne)
  const yy = parseInt(cf.slice(6, 8), 10);
  const monthIdx = CF_MONTHS.indexOf(cf[8]);
  if (monthIdx < 0) return "Il codice fiscale inserito non è valido";
  let day = parseInt(cf.slice(9, 11), 10);
  if (day > 40) day -= 40;
  if (!birthMatches(p, fullYear(yy), monthIdx + 1, day)) return ERR_BIRTH;

  // Cognome e nome
  if (cf.slice(0, 3) !== cfNameCode(p.lastName, false)) {
    return "Il codice fiscale non corrisponde al cognome indicato";
  }
  if (cf.slice(3, 6) !== cfNameCode(p.firstName, true)) {
    return "Il codice fiscale non corrisponde al nome indicato";
  }
  return null;
}

// ─── Algoritmi condivisi ────────────────────────────────────────────────────

function luhnOk(num: string): boolean {
  let sum = 0;
  for (let i = 0; i < num.length; i++) {
    let d = Number(num[num.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

// ISO 7064 MOD 11,10 (Croazia OIB, Germania IdNr)
function iso7064Mod11_10(num: string): number {
  let product = 10;
  for (let i = 0; i < num.length; i++) {
    let s = (Number(num[i]) + product) % 10;
    if (s === 0) s = 10;
    product = (s * 2) % 11;
  }
  const check = 11 - product;
  return check === 10 ? 0 : check;
}

// Tabelle Verhoeff (Lussemburgo, 13ª cifra)
const VH_D = [
  [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],
  [4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],
  [8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0],
];
const VH_P = [
  [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],
  [9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8],
];
function verhoeffOk(num: string): boolean {
  let c = 0;
  const rev = num.split("").reverse();
  for (let i = 0; i < rev.length; i++) {
    c = VH_D[c][VH_P[i % 8][Number(rev[i])]];
  }
  return c === 0;
}

// Estonia / Lituania: mod 11 a due stadi
function eeLtChecksum(num: string): boolean {
  const d = digits(num);
  const w1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1];
  const w2 = [3, 4, 5, 6, 7, 8, 9, 1, 2, 3];
  let r = d.slice(0, 10).reduce((s, x, i) => s + x * w1[i], 0) % 11;
  if (r === 10) {
    r = d.slice(0, 10).reduce((s, x, i) => s + x * w2[i], 0) % 11;
    if (r === 10) r = 0;
  }
  return r === d[10];
}

// ─── Validatori per paese ───────────────────────────────────────────────────

export const TAX_ID_SPECS: TaxIdSpec[] = [
  {
    country: "IT", nameIt: "Italia", nameEn: "Italy",
    labelIt: "Codice fiscale", labelEn: "Fiscal code (Codice fiscale)",
    placeholder: "RSSMRA80A01H501U",
    regex: /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/,
    check: validateCodiceFiscale,
    crossCheck: "fullMatch",
  },
  {
    country: "US", nameIt: "Stati Uniti", nameEn: "United States",
    labelIt: "ITIN", labelEn: "ITIN",
    placeholder: "9XX-7X-XXXX",
    regex: /^9\d{2}(5\d|6[0-5]|7\d|8[0-8]|9[0-2]|9[4-9])\d{4}$/,
    crossCheck: "structure",
  },
  {
    country: "AT", nameIt: "Austria", nameEn: "Austria",
    labelIt: "TIN (Abgabenkontonummer)", labelEn: "TIN (Abgabenkontonummer)",
    placeholder: "12-345/6789",
    regex: /^\d{9}$/,
    check: (id) => {
      const d = digits(id);
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        let v = d[i] * (i % 2 === 0 ? 1 : 2);
        if (v > 9) v -= 9;
        sum += v;
      }
      return (100 - sum) % 10 === d[8] ? null : ERR_CHECKSUM;
    },
    crossCheck: "checksum",
  },
  {
    country: "BE", nameIt: "Belgio", nameEn: "Belgium",
    labelIt: "Numero nazionale (NN)", labelEn: "National Number (NN)",
    placeholder: "85073003328",
    regex: /^\d{11}$/,
    check: (id, p) => {
      const base = id.slice(0, 9);
      const cc = parseInt(id.slice(9), 10);
      const ok1900 = 97 - (parseInt(base, 10) % 97) === cc;
      const ok2000 = 97 - (parseInt("2" + base, 10) % 97) === cc;
      if (!ok1900 && !ok2000) return ERR_CHECKSUM;
      const yy = parseInt(id.slice(0, 2), 10);
      const mm = parseInt(id.slice(2, 4), 10);
      const dd = parseInt(id.slice(4, 6), 10);
      // mese/giorno 00 = data sconosciuta al rilascio: salta il confronto
      if (mm === 0 || dd === 0) return null;
      const year = ok2000 && !ok1900 ? 2000 + yy : 1900 + yy;
      return birthMatches(p, year, mm, dd) ? null : ERR_BIRTH;
    },
    crossCheck: "birthDate",
  },
  {
    country: "BG", nameIt: "Bulgaria", nameEn: "Bulgaria",
    labelIt: "EGN (Numero civile unico)", labelEn: "UCN / EGN",
    placeholder: "7523169263",
    regex: /^\d{10}$/,
    check: (id, p) => {
      const d = digits(id);
      const w = [2, 4, 8, 5, 10, 9, 7, 3, 6];
      const r = d.slice(0, 9).reduce((s, x, i) => s + x * w[i], 0) % 11;
      if ((r === 10 ? 0 : r) !== d[9]) return ERR_CHECKSUM;
      const yy = parseInt(id.slice(0, 2), 10);
      let mm = parseInt(id.slice(2, 4), 10);
      const dd = parseInt(id.slice(4, 6), 10);
      let year = 1900 + yy;
      if (mm > 40) { mm -= 40; year = 2000 + yy; }
      else if (mm > 20) { mm -= 20; year = 1800 + yy; }
      return birthMatches(p, year, mm, dd) ? null : ERR_BIRTH;
    },
    crossCheck: "birthDate",
  },
  {
    country: "HR", nameIt: "Croazia", nameEn: "Croatia",
    labelIt: "OIB", labelEn: "OIB",
    placeholder: "12345678903",
    regex: /^\d{11}$/,
    check: (id) =>
      iso7064Mod11_10(id.slice(0, 10)) === Number(id[10]) ? null : ERR_CHECKSUM,
    crossCheck: "checksum",
  },
  {
    country: "CY", nameIt: "Cipro", nameEn: "Cyprus",
    labelIt: "TIC (Tax Identification Code)", labelEn: "TIC",
    placeholder: "99652156X",
    regex: /^[0-9]{8}[A-Z]$/,
    check: (id) => {
      const map = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21];
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        const d = Number(id[i]);
        sum += i % 2 === 0 ? map[d] : d;
      }
      return String.fromCharCode(65 + (sum % 26)) === id[8] ? null : ERR_CHECKSUM;
    },
    crossCheck: "checksum",
  },
  {
    country: "CZ", nameIt: "Repubblica Ceca", nameEn: "Czechia",
    labelIt: "Rodné číslo (numero di nascita)", labelEn: "Birth number (Rodné číslo)",
    placeholder: "8506030445",
    regex: /^\d{9,10}$/,
    check: (id, p) => czSkBirthNumber(id, p),
    crossCheck: "birthDate",
  },
  {
    country: "DK", nameIt: "Danimarca", nameEn: "Denmark",
    labelIt: "CPR", labelEn: "CPR number",
    placeholder: "030785-1234",
    regex: /^\d{10}$/,
    check: (id, p) => {
      const dd = parseInt(id.slice(0, 2), 10);
      const mm = parseInt(id.slice(2, 4), 10);
      const yy = parseInt(id.slice(4, 6), 10);
      // Il mod-11 non è più garantito dal 2007: si verifica solo la data
      return birthMatches(p, fullYear(yy), mm, dd) ? null : ERR_BIRTH;
    },
    crossCheck: "birthDate",
  },
  {
    country: "EE", nameIt: "Estonia", nameEn: "Estonia",
    labelIt: "Isikukood (codice personale)", labelEn: "Personal code (Isikukood)",
    placeholder: "38501020000",
    regex: /^[1-8]\d{10}$/,
    check: (id, p) => {
      if (!eeLtChecksum(id)) return ERR_CHECKSUM;
      const g = Number(id[0]);
      const century = g <= 2 ? 1800 : g <= 4 ? 1900 : g <= 6 ? 2000 : 2100;
      const yy = parseInt(id.slice(1, 3), 10);
      const mm = parseInt(id.slice(3, 5), 10);
      const dd = parseInt(id.slice(5, 7), 10);
      return birthMatches(p, century + yy, mm, dd) ? null : ERR_BIRTH;
    },
    crossCheck: "birthDate",
  },
  {
    country: "FI", nameIt: "Finlandia", nameEn: "Finland",
    labelIt: "Henkilötunnus (HETU)", labelEn: "Personal identity code (HETU)",
    placeholder: "131052-308T",
    regex: /^\d{6}[+\-A]\d{3}[0-9A-FHJ-NPR-Y]$/,
    check: (id, p) => {
      const num = id.slice(0, 6) + id.slice(7, 10);
      const alphabet = "0123456789ABCDEFHJKLMNPRSTUVWXY";
      if (alphabet[parseInt(num, 10) % 31] !== id[10]) return ERR_CHECKSUM;
      const dd = parseInt(id.slice(0, 2), 10);
      const mm = parseInt(id.slice(2, 4), 10);
      const yy = parseInt(id.slice(4, 6), 10);
      const century = id[6] === "+" ? 1800 : id[6] === "-" ? 1900 : 2000;
      return birthMatches(p, century + yy, mm, dd) ? null : ERR_BIRTH;
    },
    crossCheck: "birthDate",
  },
  {
    country: "FR", nameIt: "Francia", nameEn: "France",
    labelIt: "Numéro fiscal (SPI)", labelEn: "Tax number (SPI)",
    placeholder: "0123456789012",
    regex: /^[0-3]\d{12}$/,
    crossCheck: "structure",
  },
  {
    country: "DE", nameIt: "Germania", nameEn: "Germany",
    labelIt: "Steuer-IdNr.", labelEn: "Tax ID (Steuer-IdNr.)",
    placeholder: "12345678995",
    regex: /^[1-9]\d{10}$/,
    check: (id) =>
      iso7064Mod11_10(id.slice(0, 10)) === Number(id[10]) ? null : ERR_CHECKSUM,
    crossCheck: "checksum",
  },
  {
    country: "EL", nameIt: "Grecia", nameEn: "Greece",
    labelIt: "AFM (ΑΦΜ)", labelEn: "AFM (ΑΦΜ)",
    placeholder: "123456783",
    regex: /^\d{9}$/,
    check: (id) => {
      const d = digits(id);
      const sum = d.slice(0, 8).reduce((s, x, i) => s + x * Math.pow(2, 8 - i), 0);
      return (sum % 11) % 10 === d[8] ? null : ERR_CHECKSUM;
    },
    crossCheck: "checksum",
  },
  {
    country: "HU", nameIt: "Ungheria", nameEn: "Hungary",
    labelIt: "Adóazonosító jel", labelEn: "Tax ID (Adóazonosító jel)",
    placeholder: "8071592153",
    regex: /^8\d{9}$/,
    check: (id) => {
      const d = digits(id);
      const r = d.slice(0, 9).reduce((s, x, i) => s + x * (i + 1), 0) % 11;
      if (r === 10) return ERR_CHECKSUM;
      return r === d[9] ? null : ERR_CHECKSUM;
    },
    crossCheck: "checksum",
  },
  {
    country: "IE", nameIt: "Irlanda", nameEn: "Ireland",
    labelIt: "PPS Number", labelEn: "PPS Number",
    placeholder: "1234567FA",
    regex: /^\d{7}[A-W][A-IW]?$/,
    check: (id) => {
      const d = digits(id.slice(0, 7));
      let sum = d.reduce((s, x, i) => s + x * (8 - i), 0);
      if (id.length === 9) sum += 9 * (id.charCodeAt(8) === 87 ? 0 : id.charCodeAt(8) - 64);
      return "WABCDEFGHIJKLMNOPQRSTUV"[sum % 23] === id[7] ? null : ERR_CHECKSUM;
    },
    crossCheck: "checksum",
  },
  {
    country: "LV", nameIt: "Lettonia", nameEn: "Latvia",
    labelIt: "Codice personale", labelEn: "Personal code",
    placeholder: "01018012345",
    regex: /^\d{11}$/,
    check: (id, p) => {
      if (id.startsWith("32")) return null; // nuovo formato: nessun dato personale
      const w = [1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      const d = digits(id);
      const c = ((1101 - d.slice(0, 10).reduce((s, x, i) => s + x * w[i], 0)) % 11) % 10;
      if (c !== d[10]) return ERR_CHECKSUM;
      const dd = parseInt(id.slice(0, 2), 10);
      const mm = parseInt(id.slice(2, 4), 10);
      const yy = parseInt(id.slice(4, 6), 10);
      const century = Number(id[6]) === 0 ? 1800 : Number(id[6]) === 1 ? 1900 : 2000;
      return birthMatches(p, century + yy, mm, dd) ? null : ERR_BIRTH;
    },
    crossCheck: "birthDate",
  },
  {
    country: "LT", nameIt: "Lituania", nameEn: "Lithuania",
    labelIt: "Asmens kodas (codice personale)", labelEn: "Personal code (Asmens kodas)",
    placeholder: "38501020000",
    regex: /^[1-8]\d{10}$/,
    check: (id, p) => {
      if (!eeLtChecksum(id)) return ERR_CHECKSUM;
      const g = Number(id[0]);
      const century = g <= 2 ? 1800 : g <= 4 ? 1900 : g <= 6 ? 2000 : 2100;
      const yy = parseInt(id.slice(1, 3), 10);
      const mm = parseInt(id.slice(3, 5), 10);
      const dd = parseInt(id.slice(5, 7), 10);
      return birthMatches(p, century + yy, mm, dd) ? null : ERR_BIRTH;
    },
    crossCheck: "birthDate",
  },
  {
    country: "LU", nameIt: "Lussemburgo", nameEn: "Luxembourg",
    labelIt: "Numero di identificazione (matricule)", labelEn: "National ID (matricule)",
    placeholder: "1985073012342",
    regex: /^\d{13}$/,
    check: (id, p) => {
      if (!luhnOk(id.slice(0, 12))) return ERR_CHECKSUM;
      if (!verhoeffOk(id.slice(0, 11) + id[12])) return ERR_CHECKSUM;
      const year = parseInt(id.slice(0, 4), 10);
      const mm = parseInt(id.slice(4, 6), 10);
      const dd = parseInt(id.slice(6, 8), 10);
      return birthMatches(p, year, mm, dd) ? null : ERR_BIRTH;
    },
    crossCheck: "birthDate",
  },
  {
    country: "MT", nameIt: "Malta", nameEn: "Malta",
    labelIt: "Numero carta d'identità", labelEn: "ID card number",
    placeholder: "1234567M",
    regex: /^\d{3,7}[MGAPLHBZ]$/,
    crossCheck: "structure",
  },
  {
    country: "NL", nameIt: "Paesi Bassi", nameEn: "Netherlands",
    labelIt: "BSN (Burgerservicenummer)", labelEn: "BSN (Citizen Service Number)",
    placeholder: "111222333",
    regex: /^\d{9}$/,
    check: (id) => {
      const d = digits(id);
      const sum = d.slice(0, 8).reduce((s, x, i) => s + x * (9 - i), 0) - d[8];
      return sum % 11 === 0 ? null : ERR_CHECKSUM;
    },
    crossCheck: "checksum",
  },
  {
    country: "PL", nameIt: "Polonia", nameEn: "Poland",
    labelIt: "PESEL", labelEn: "PESEL",
    placeholder: "85070312345",
    regex: /^\d{11}$/,
    check: (id, p) => {
      const d = digits(id);
      const w = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
      const c = (10 - (d.slice(0, 10).reduce((s, x, i) => s + x * w[i], 0) % 10)) % 10;
      if (c !== d[10]) return ERR_CHECKSUM;
      const yy = parseInt(id.slice(0, 2), 10);
      let mm = parseInt(id.slice(2, 4), 10);
      const dd = parseInt(id.slice(4, 6), 10);
      let year = 1900 + yy;
      if (mm > 80) { mm -= 80; year = 1800 + yy; }
      else if (mm > 60) { mm -= 60; year = 2200 + yy; }
      else if (mm > 40) { mm -= 40; year = 2100 + yy; }
      else if (mm > 20) { mm -= 20; year = 2000 + yy; }
      return birthMatches(p, year, mm, dd) ? null : ERR_BIRTH;
    },
    crossCheck: "birthDate",
  },
  {
    country: "PT", nameIt: "Portogallo", nameEn: "Portugal",
    labelIt: "NIF (Número de contribuinte)", labelEn: "NIF",
    placeholder: "123456789",
    regex: /^\d{9}$/,
    check: (id) => {
      const d = digits(id);
      let c = 11 - (d.slice(0, 8).reduce((s, x, i) => s + x * (9 - i), 0) % 11);
      if (c >= 10) c = 0;
      return c === d[8] ? null : ERR_CHECKSUM;
    },
    crossCheck: "checksum",
  },
  {
    country: "RO", nameIt: "Romania", nameEn: "Romania",
    labelIt: "CNP", labelEn: "CNP",
    placeholder: "1850703123456",
    regex: /^[1-8]\d{12}$/,
    check: (id, p) => {
      const d = digits(id);
      const w = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
      let c = d.slice(0, 12).reduce((s, x, i) => s + x * w[i], 0) % 11;
      if (c === 10) c = 1;
      if (c !== d[12]) return ERR_CHECKSUM;
      const s = Number(id[0]);
      const century = s <= 2 ? 1900 : s <= 4 ? 1800 : s <= 6 ? 2000 : 1900;
      const yy = parseInt(id.slice(1, 3), 10);
      const mm = parseInt(id.slice(3, 5), 10);
      const dd = parseInt(id.slice(5, 7), 10);
      // 7/8 = residenti stranieri: il secolo non è determinato dal prefisso
      if (s >= 7) {
        const y = fullYear(yy);
        return birthMatches(p, y, mm, dd) ? null : ERR_BIRTH;
      }
      return birthMatches(p, century + yy, mm, dd) ? null : ERR_BIRTH;
    },
    crossCheck: "birthDate",
  },
  {
    country: "SK", nameIt: "Slovacchia", nameEn: "Slovakia",
    labelIt: "Rodné číslo (numero di nascita)", labelEn: "Birth number (Rodné číslo)",
    placeholder: "8506030445",
    regex: /^\d{9,10}$/,
    check: (id, p) => czSkBirthNumber(id, p),
    crossCheck: "birthDate",
  },
  {
    country: "SI", nameIt: "Slovenia", nameEn: "Slovenia",
    labelIt: "Davčna številka", labelEn: "Tax number (Davčna številka)",
    placeholder: "15012557",
    regex: /^[1-9]\d{7}$/,
    check: (id) => {
      const d = digits(id);
      let c = 11 - (d.slice(0, 7).reduce((s, x, i) => s + x * (8 - i), 0) % 11);
      if (c === 10) c = 0;
      if (c === 11) return ERR_CHECKSUM;
      return c === d[7] ? null : ERR_CHECKSUM;
    },
    crossCheck: "checksum",
  },
  {
    country: "ES", nameIt: "Spagna", nameEn: "Spain",
    labelIt: "DNI / NIE", labelEn: "DNI / NIE",
    placeholder: "12345678Z",
    regex: /^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z])$/,
    check: (id) => {
      const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
      let num: number;
      if (/^\d/.test(id)) {
        num = parseInt(id.slice(0, 8), 10);
      } else {
        const prefix = { X: "0", Y: "1", Z: "2" }[id[0] as "X" | "Y" | "Z"];
        num = parseInt(prefix + id.slice(1, 8), 10);
      }
      return letters[num % 23] === id[id.length - 1] ? null : ERR_CHECKSUM;
    },
    crossCheck: "checksum",
  },
  {
    country: "SE", nameIt: "Svezia", nameEn: "Sweden",
    labelIt: "Personnummer", labelEn: "Personal identity number",
    placeholder: "850703-1234",
    regex: /^\d{10}(\d{2})?$/,
    check: (id, p) => {
      // Accetta 10 cifre (YYMMDDNNNC) o 12 (YYYYMMDDNNNC)
      const ten = id.length === 12 ? id.slice(2) : id;
      if (!luhnOk(ten)) return ERR_CHECKSUM;
      const yy = parseInt(ten.slice(0, 2), 10);
      const mm = parseInt(ten.slice(2, 4), 10);
      let dd = parseInt(ten.slice(4, 6), 10);
      if (dd > 60) dd -= 60; // numero di coordinamento
      const year = id.length === 12 ? parseInt(id.slice(0, 4), 10) : fullYear(yy);
      return birthMatches(p, year, mm, dd) ? null : ERR_BIRTH;
    },
    crossCheck: "birthDate",
  },
];

// Rodné číslo ceco/slovacco (condiviso)
function czSkBirthNumber(id: string, p: PersonData): string | null {
  const yy = parseInt(id.slice(0, 2), 10);
  let mm = parseInt(id.slice(2, 4), 10);
  const dd = parseInt(id.slice(4, 6), 10);
  if (mm > 70) mm -= 70;      // donne, serie estesa
  else if (mm > 50) mm -= 50; // donne
  else if (mm > 20) mm -= 20; // uomini, serie estesa
  if (id.length === 10) {
    if (parseInt(id, 10) % 11 !== 0) return ERR_CHECKSUM;
    const year = yy < 54 ? 2000 + yy : 1900 + yy;
    return birthMatches(p, year, mm, dd) ? null : ERR_BIRTH;
  }
  // 9 cifre: solo nati prima del 1954, nessuna cifra di controllo
  return birthMatches(p, 1900 + yy, mm, dd) ? null : ERR_BIRTH;
}

export function getTaxIdSpec(country: string): TaxIdSpec | undefined {
  return TAX_ID_SPECS.find((s) => s.country === country);
}

/**
 * Validazione completa: formato + checksum + controllo incrociato.
 * Ritorna un messaggio di errore (in italiano) oppure null se tutto valido.
 */
export function validateTaxId(
  country: string,
  rawId: string,
  person: PersonData
): string | null {
  const spec = getTaxIdSpec(country);
  if (!spec) return "Paese non supportato";
  const id = normalizeTaxId(rawId, country);
  if (!spec.regex.test(id)) {
    return `Formato non valido per ${spec.labelIt} (es. ${spec.placeholder})`;
  }
  if (spec.check) return spec.check(id, person);
  return null;
}
