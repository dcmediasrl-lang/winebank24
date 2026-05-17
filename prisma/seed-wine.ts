import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const denominations = [
  // ===== DOCG =====
  // PIEMONTE
  { name: "Barolo", type: "DOCG", region: "Piemonte", grapes: ["Nebbiolo"], wineTypes: ["ROSSO"] },
  { name: "Barbaresco", type: "DOCG", region: "Piemonte", grapes: ["Nebbiolo"], wineTypes: ["ROSSO"] },
  { name: "Asti", type: "DOCG", region: "Piemonte", grapes: ["Moscato Bianco"], wineTypes: ["SPUMANTE", "BIANCO"] },
  { name: "Moscato d'Asti", type: "DOCG", region: "Piemonte", grapes: ["Moscato Bianco"], wineTypes: ["BIANCO"] },
  { name: "Brachetto d'Acqui", type: "DOCG", region: "Piemonte", grapes: ["Brachetto"], wineTypes: ["ROSSO", "SPUMANTE"] },
  { name: "Gavi", type: "DOCG", region: "Piemonte", grapes: ["Cortese"], wineTypes: ["BIANCO"] },
  { name: "Ghemme", type: "DOCG", region: "Piemonte", grapes: ["Nebbiolo", "Vespolina"], wineTypes: ["ROSSO"] },
  { name: "Gattinara", type: "DOCG", region: "Piemonte", grapes: ["Nebbiolo", "Vespolina", "Uva Rara"], wineTypes: ["ROSSO"] },
  { name: "Alta Langa", type: "DOCG", region: "Piemonte", grapes: ["Pinot Nero", "Chardonnay"], wineTypes: ["SPUMANTE"] },
  { name: "Dogliani", type: "DOCG", region: "Piemonte", grapes: ["Dolcetto"], wineTypes: ["ROSSO"] },
  { name: "Dolcetto di Diano d'Alba", type: "DOCG", region: "Piemonte", grapes: ["Dolcetto"], wineTypes: ["ROSSO"] },
  { name: "Dolcetto di Ovada Superiore", type: "DOCG", region: "Piemonte", grapes: ["Dolcetto"], wineTypes: ["ROSSO"] },
  { name: "Erbaluce di Caluso", type: "DOCG", region: "Piemonte", grapes: ["Erbaluce"], wineTypes: ["BIANCO", "SPUMANTE", "PASSITO"] },
  { name: "Ruchè di Castagnole Monferrato", type: "DOCG", region: "Piemonte", grapes: ["Ruchè"], wineTypes: ["ROSSO"] },
  { name: "Nizza", type: "DOCG", region: "Piemonte", grapes: ["Barbera"], wineTypes: ["ROSSO"] },
  { name: "Cannubi Boschis", type: "DOCG", region: "Piemonte", grapes: ["Nebbiolo"], wineTypes: ["ROSSO"] },
  // VALLE D'AOSTA
  { name: "Valle d'Aosta", type: "DOC", region: "Valle d'Aosta", grapes: ["Fumin", "Cornalin", "Petit Rouge", "Moscato Bianco"], wineTypes: ["ROSSO", "BIANCO"] },
  // LOMBARDIA
  { name: "Sforzato di Valtellina", type: "DOCG", region: "Lombardia", grapes: ["Nebbiolo"], wineTypes: ["ROSSO"] },
  { name: "Valtellina Superiore", type: "DOCG", region: "Lombardia", grapes: ["Nebbiolo"], wineTypes: ["ROSSO"] },
  { name: "Franciacorta", type: "DOCG", region: "Lombardia", grapes: ["Chardonnay", "Pinot Nero", "Pinot Bianco"], wineTypes: ["SPUMANTE"] },
  { name: "Oltrepò Pavese Metodo Classico", type: "DOCG", region: "Lombardia", grapes: ["Pinot Nero"], wineTypes: ["SPUMANTE"] },
  { name: "Scanzo", type: "DOCG", region: "Lombardia", grapes: ["Moscato di Scanzo"], wineTypes: ["ROSSO", "PASSITO"] },
  // TRENTINO-ALTO ADIGE
  { name: "Alto Adige", type: "DOC", region: "Trentino-Alto Adige", grapes: ["Schiava", "Lagrein", "Pinot Nero", "Gewürztraminer", "Pinot Grigio"], wineTypes: ["ROSSO", "BIANCO"] },
  { name: "Trentino", type: "DOC", region: "Trentino-Alto Adige", grapes: ["Teroldego", "Marzemino", "Nosiola", "Chardonnay"], wineTypes: ["ROSSO", "BIANCO", "SPUMANTE"] },
  { name: "Trento", type: "DOC", region: "Trentino-Alto Adige", grapes: ["Chardonnay", "Pinot Nero", "Pinot Meunier", "Pinot Bianco"], wineTypes: ["SPUMANTE"] },
  { name: "Teroldego Rotaliano", type: "DOC", region: "Trentino-Alto Adige", grapes: ["Teroldego"], wineTypes: ["ROSSO"] },
  // VENETO
  { name: "Amarone della Valpolicella", type: "DOCG", region: "Veneto", grapes: ["Corvina", "Corvinone", "Rondinella"], wineTypes: ["ROSSO"] },
  { name: "Recioto della Valpolicella", type: "DOCG", region: "Veneto", grapes: ["Corvina", "Corvinone", "Rondinella"], wineTypes: ["ROSSO", "PASSITO"] },
  { name: "Recioto di Soave", type: "DOCG", region: "Veneto", grapes: ["Garganega"], wineTypes: ["BIANCO", "PASSITO"] },
  { name: "Soave Superiore", type: "DOCG", region: "Veneto", grapes: ["Garganega"], wineTypes: ["BIANCO"] },
  { name: "Bardolino Superiore", type: "DOCG", region: "Veneto", grapes: ["Corvina", "Rondinella", "Molinara"], wineTypes: ["ROSSO"] },
  { name: "Conegliano Valdobbiadene Prosecco Superiore", type: "DOCG", region: "Veneto", grapes: ["Glera"], wineTypes: ["SPUMANTE", "BIANCO"] },
  { name: "Asolo Prosecco Superiore", type: "DOCG", region: "Veneto", grapes: ["Glera"], wineTypes: ["SPUMANTE"] },
  { name: "Colli Asolani Prosecco", type: "DOCG", region: "Veneto", grapes: ["Glera"], wineTypes: ["SPUMANTE", "BIANCO"] },
  { name: "Valpolicella", type: "DOC", region: "Veneto", grapes: ["Corvina", "Corvinone", "Rondinella"], wineTypes: ["ROSSO"] },
  { name: "Soave", type: "DOC", region: "Veneto", grapes: ["Garganega", "Trebbiano di Soave"], wineTypes: ["BIANCO"] },
  { name: "Prosecco", type: "DOC", region: "Veneto", grapes: ["Glera"], wineTypes: ["SPUMANTE", "BIANCO"] },
  // FRIULI-VENEZIA GIULIA
  { name: "Ramandolo", type: "DOCG", region: "Friuli-Venezia Giulia", grapes: ["Verduzzo Friulano"], wineTypes: ["BIANCO", "PASSITO"] },
  { name: "Rosazzo", type: "DOCG", region: "Friuli-Venezia Giulia", grapes: ["Friulano", "Pinot Bianco", "Sauvignon Blanc", "Chardonnay"], wineTypes: ["BIANCO"] },
  { name: "Collio Goriziano", type: "DOC", region: "Friuli-Venezia Giulia", grapes: ["Friulano", "Pinot Grigio", "Sauvignon Blanc", "Chardonnay"], wineTypes: ["BIANCO"] },
  { name: "Friuli Colli Orientali", type: "DOC", region: "Friuli-Venezia Giulia", grapes: ["Friulano", "Picolit", "Refosco", "Schioppettino"], wineTypes: ["BIANCO", "ROSSO"] },
  // LIGURIA
  { name: "Cinque Terre", type: "DOC", region: "Liguria", grapes: ["Bosco", "Albarola", "Vermentino"], wineTypes: ["BIANCO"] },
  { name: "Rossese di Dolceacqua", type: "DOC", region: "Liguria", grapes: ["Rossese"], wineTypes: ["ROSSO"] },
  // EMILIA-ROMAGNA
  { name: "Albana di Romagna", type: "DOCG", region: "Emilia-Romagna", grapes: ["Albana"], wineTypes: ["BIANCO", "PASSITO"] },
  { name: "Colli Bolognesi Classico Pignoletto", type: "DOCG", region: "Emilia-Romagna", grapes: ["Pignoletto"], wineTypes: ["BIANCO", "SPUMANTE"] },
  { name: "Lambrusco di Sorbara", type: "DOC", region: "Emilia-Romagna", grapes: ["Lambrusco di Sorbara"], wineTypes: ["ROSSO", "ROSATO"] },
  { name: "Lambrusco Grasparossa di Castelvetro", type: "DOC", region: "Emilia-Romagna", grapes: ["Lambrusco Grasparossa"], wineTypes: ["ROSSO", "ROSATO"] },
  { name: "Sangiovese di Romagna", type: "DOC", region: "Emilia-Romagna", grapes: ["Sangiovese"], wineTypes: ["ROSSO"] },
  // TOSCANA
  { name: "Brunello di Montalcino", type: "DOCG", region: "Toscana", grapes: ["Sangiovese"], wineTypes: ["ROSSO"] },
  { name: "Chianti", type: "DOCG", region: "Toscana", grapes: ["Sangiovese", "Canaiolo", "Trebbiano Toscano"], wineTypes: ["ROSSO"] },
  { name: "Chianti Classico", type: "DOCG", region: "Toscana", grapes: ["Sangiovese"], wineTypes: ["ROSSO"] },
  { name: "Vino Nobile di Montepulciano", type: "DOCG", region: "Toscana", grapes: ["Sangiovese", "Canaiolo"], wineTypes: ["ROSSO"] },
  { name: "Vernaccia di San Gimignano", type: "DOCG", region: "Toscana", grapes: ["Vernaccia di San Gimignano"], wineTypes: ["BIANCO"] },
  { name: "Morellino di Scansano", type: "DOCG", region: "Toscana", grapes: ["Sangiovese"], wineTypes: ["ROSSO"] },
  { name: "Bolgheri", type: "DOC", region: "Toscana", grapes: ["Cabernet Sauvignon", "Merlot", "Cabernet Franc", "Sangiovese"], wineTypes: ["ROSSO", "BIANCO", "ROSATO"] },
  { name: "Maremma Toscana", type: "DOC", region: "Toscana", grapes: ["Sangiovese", "Cabernet Sauvignon", "Merlot", "Vermentino"], wineTypes: ["ROSSO", "BIANCO", "ROSATO"] },
  { name: "Montecucco Sangiovese", type: "DOCG", region: "Toscana", grapes: ["Sangiovese"], wineTypes: ["ROSSO"] },
  { name: "Suvereto", type: "DOCG", region: "Toscana", grapes: ["Merlot", "Cabernet Sauvignon"], wineTypes: ["ROSSO"] },
  { name: "Val di Cornia Rosso", type: "DOCG", region: "Toscana", grapes: ["Sangiovese", "Cabernet Sauvignon", "Merlot"], wineTypes: ["ROSSO"] },
  { name: "Carmignano", type: "DOCG", region: "Toscana", grapes: ["Sangiovese", "Cabernet Franc", "Cabernet Sauvignon"], wineTypes: ["ROSSO"] },
  // MARCHE
  { name: "Conero", type: "DOCG", region: "Marche", grapes: ["Montepulciano"], wineTypes: ["ROSSO"] },
  { name: "Offida", type: "DOCG", region: "Marche", grapes: ["Passerina", "Pecorino", "Montepulciano"], wineTypes: ["BIANCO", "ROSSO"] },
  { name: "Verdicchio dei Castelli di Jesi", type: "DOC", region: "Marche", grapes: ["Verdicchio"], wineTypes: ["BIANCO", "SPUMANTE"] },
  { name: "Verdicchio di Matelica", type: "DOC", region: "Marche", grapes: ["Verdicchio"], wineTypes: ["BIANCO", "SPUMANTE"] },
  // UMBRIA
  { name: "Sagrantino di Montefalco", type: "DOCG", region: "Umbria", grapes: ["Sagrantino"], wineTypes: ["ROSSO", "PASSITO"] },
  { name: "Montefalco Sagrantino", type: "DOCG", region: "Umbria", grapes: ["Sagrantino"], wineTypes: ["ROSSO"] },
  { name: "Orvieto", type: "DOC", region: "Umbria", grapes: ["Grechetto", "Trebbiano Toscano"], wineTypes: ["BIANCO"] },
  { name: "Torgiano Rosso Riserva", type: "DOCG", region: "Umbria", grapes: ["Sangiovese", "Canaiolo"], wineTypes: ["ROSSO"] },
  // LAZIO
  { name: "Cannellino di Frascati", type: "DOCG", region: "Lazio", grapes: ["Malvasia Bianca di Candia", "Greco"], wineTypes: ["BIANCO"] },
  { name: "Frascati Superiore", type: "DOCG", region: "Lazio", grapes: ["Malvasia Bianca di Candia", "Greco", "Trebbiano"], wineTypes: ["BIANCO"] },
  // ABRUZZO
  { name: "Montepulciano d'Abruzzo Colline Teramane", type: "DOCG", region: "Abruzzo", grapes: ["Montepulciano"], wineTypes: ["ROSSO"] },
  { name: "Trebbiano d'Abruzzo", type: "DOC", region: "Abruzzo", grapes: ["Trebbiano d'Abruzzo"], wineTypes: ["BIANCO"] },
  { name: "Cerasuolo d'Abruzzo", type: "DOC", region: "Abruzzo", grapes: ["Montepulciano"], wineTypes: ["ROSATO"] },
  // MOLISE
  { name: "Molise", type: "DOC", region: "Molise", grapes: ["Montepulciano", "Aglianico", "Falanghina"], wineTypes: ["ROSSO", "BIANCO"] },
  // CAMPANIA
  { name: "Aglianico del Taburno", type: "DOCG", region: "Campania", grapes: ["Aglianico"], wineTypes: ["ROSSO"] },
  { name: "Fiano di Avellino", type: "DOCG", region: "Campania", grapes: ["Fiano"], wineTypes: ["BIANCO"] },
  { name: "Greco di Tufo", type: "DOCG", region: "Campania", grapes: ["Greco"], wineTypes: ["BIANCO", "SPUMANTE"] },
  { name: "Taurasi", type: "DOCG", region: "Campania", grapes: ["Aglianico"], wineTypes: ["ROSSO"] },
  // BASILICATA
  { name: "Aglianico del Vulture Superiore", type: "DOCG", region: "Basilicata", grapes: ["Aglianico"], wineTypes: ["ROSSO"] },
  { name: "Aglianico del Vulture", type: "DOC", region: "Basilicata", grapes: ["Aglianico"], wineTypes: ["ROSSO"] },
  // CALABRIA
  { name: "Cirò", type: "DOC", region: "Calabria", grapes: ["Gaglioppo"], wineTypes: ["ROSSO", "ROSATO"] },
  { name: "Greco di Bianco", type: "DOC", region: "Calabria", grapes: ["Greco Bianco"], wineTypes: ["BIANCO", "PASSITO"] },
  // PUGLIA
  { name: "Primitivo di Manduria Dolce Naturale", type: "DOCG", region: "Puglia", grapes: ["Primitivo"], wineTypes: ["ROSSO", "PASSITO"] },
  { name: "Castel del Monte Bombino Nero", type: "DOCG", region: "Puglia", grapes: ["Bombino Nero"], wineTypes: ["ROSATO"] },
  { name: "Castel del Monte Nero di Troia Riserva", type: "DOCG", region: "Puglia", grapes: ["Uva di Troia"], wineTypes: ["ROSSO"] },
  { name: "Castel del Monte Rosso Riserva", type: "DOCG", region: "Puglia", grapes: ["Uva di Troia"], wineTypes: ["ROSSO"] },
  { name: "Primitivo di Manduria", type: "DOC", region: "Puglia", grapes: ["Primitivo"], wineTypes: ["ROSSO"] },
  { name: "Salice Salentino", type: "DOC", region: "Puglia", grapes: ["Negroamaro", "Malvasia Nera"], wineTypes: ["ROSSO", "ROSATO"] },
  { name: "Negroamaro", type: "DOC", region: "Puglia", grapes: ["Negroamaro"], wineTypes: ["ROSSO", "ROSATO"] },
  // SICILIA
  { name: "Cerasuolo di Vittoria", type: "DOCG", region: "Sicilia", grapes: ["Nero d'Avola", "Frappato"], wineTypes: ["ROSSO"] },
  { name: "Etna", type: "DOC", region: "Sicilia", grapes: ["Nerello Mascalese", "Nerello Cappuccio", "Carricante"], wineTypes: ["ROSSO", "BIANCO", "ROSATO"] },
  { name: "Marsala", type: "DOC", region: "Sicilia", grapes: ["Grillo", "Catarratto", "Inzolia"], wineTypes: ["BIANCO"] },
  { name: "Nero d'Avola", type: "DOC", region: "Sicilia", grapes: ["Nero d'Avola"], wineTypes: ["ROSSO"] },
  { name: "Passito di Pantelleria", type: "DOC", region: "Sicilia", grapes: ["Zibibbo"], wineTypes: ["BIANCO", "PASSITO"] },
  // SARDEGNA
  { name: "Vermentino di Gallura", type: "DOCG", region: "Sardegna", grapes: ["Vermentino"], wineTypes: ["BIANCO"] },
  { name: "Cannonau di Sardegna", type: "DOC", region: "Sardegna", grapes: ["Cannonau"], wineTypes: ["ROSSO", "ROSATO"] },
  { name: "Carignano del Sulcis", type: "DOC", region: "Sardegna", grapes: ["Carignano"], wineTypes: ["ROSSO", "ROSATO"] },
  { name: "Vermentino di Sardegna", type: "DOC", region: "Sardegna", grapes: ["Vermentino"], wineTypes: ["BIANCO"] },
  { name: "Vernaccia di Oristano", type: "DOC", region: "Sardegna", grapes: ["Vernaccia di Oristano"], wineTypes: ["BIANCO"] },
  { name: "Nuragus di Cagliari", type: "DOC", region: "Sardegna", grapes: ["Nuragus"], wineTypes: ["BIANCO"] },
];

async function main() {
  console.log("Seeding wine denominations...");
  let created = 0;
  for (const d of denominations) {
    await db.wineDenomination.upsert({
      where: { name: d.name },
      update: d,
      create: d,
    });
    created++;
  }
  console.log(`Done: ${created} wine denominations seeded.`);
}

main().catch(console.error).finally(() => db.$disconnect());
