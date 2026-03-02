import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const passwordHash = await bcrypt.hash("123456n", 12);

  // Migrate old admin email if it still exists
  await prisma.user.updateMany({
    where: { email: "admin@warehouse.ru" },
    data: { email: "mysklad@warehouse.com", passwordHash },
  });

  const admin = await prisma.user.upsert({
    where: { email: "mysklad@warehouse.com" },
    update: { passwordHash },
    create: {
      name: "Администратор",
      email: "mysklad@warehouse.com",
      passwordHash,
    },
  });

  console.log("Created user:", admin.email);

  // Create a test SKU
  const sku = await prisma.sKU.upsert({
    where: { artikul: "TEST-001" },
    update: {},
    create: {
      artikul: "TEST-001",
      model: "Тестовая модель",
      color: "Чёрный",
      note: "Тестовый товар",
    },
  });

  console.log("Created SKU:", sku.artikul);

  // Create test operations
  await prisma.operation.createMany({
    data: [
      {
        type: "PRIHOD",
        skuId: sku.id,
        qty: 100,
        date: new Date("2024-01-10"),
        userId: admin.id,
        note: "Первая партия",
      },
      {
        type: "OTGRUZKA",
        skuId: sku.id,
        qty: 30,
        marketplace: "Wildberries",
        date: new Date("2024-01-15"),
        userId: admin.id,
      },
      {
        type: "OTGRUZKA",
        skuId: sku.id,
        qty: 20,
        marketplace: "Ozon",
        date: new Date("2024-01-20"),
        userId: admin.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Created test operations");
  console.log("\nDone! Login: mysklad@warehouse.com / 123456n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
