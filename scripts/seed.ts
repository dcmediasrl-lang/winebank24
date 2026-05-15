import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("admin123!", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@winebank24.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@winebank24.com",
      password,
      role: "ADMIN",
    },
  });

  await db.platformConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", platformFeePct: 2.5, cantinaFeePct: 5.0 },
  });

  console.log("✓ Admin creato:", admin.email);
  console.log("✓ Password: admin123!");
  console.log("✓ Configurazione piattaforma creata");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
