import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await argon2.hash("admin123");
  const operatorPassword = await argon2.hash("operator123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@vault.com" },
    update: {},
    create: {
      email: "admin@vault.com",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const operator = await prisma.user.upsert({
    where: { email: "operator@vault.com" },
    update: {},
    create: {
      email: "operator@vault.com",
      name: "Operator",
      password: operatorPassword,
      role: "OPERATOR",
    },
  });

  const now = new Date();
  const sampleTransactions = [
    { userId: operator.id, type: "INCOME", amount: 5200, description: "Salário", category: "Salário", date: now },
    { userId: operator.id, type: "EXPENSE", amount: 187.9, description: "Supermercado", category: "Alimentação", date: now },
    { userId: operator.id, type: "EXPENSE", amount: 1800, description: "Aluguel", category: "Moradia", date: now },
    { userId: operator.id, type: "EXPENSE", amount: 98.5, description: "Gasolina", category: "Transporte", date: now },
    { userId: operator.id, type: "INCOME", amount: 850, description: "Freelance", category: "Freelance", date: now },
    { userId: operator.id, type: "EXPENSE", amount: 250, description: "Jantar fora", category: "Alimentação", paymentMethod: "Cartão de crédito", date: new Date(now.getTime() - 2 * 86400000) },
    { userId: operator.id, type: "INCOME", amount: 2400, description: "Projeto extra", category: "Freelance", date: new Date(now.getTime() - 5 * 86400000) },
  ];

  await prisma.transaction.deleteMany({ where: { userId: operator.id } });

  for (const t of sampleTransactions) {
    await prisma.transaction.create({
      data: {
        userId: t.userId,
        type: t.type,
        amount: t.amount,
        description: t.description,
        category: t.category,
        date: t.date,
        paymentMethod: t.paymentMethod ?? null,
      },
    });
  }

  console.log("Seeded users:", {
    admin: admin.email,
    operator: operator.email,
  });
  console.log(`Seeded ${sampleTransactions.length} transactions for operator`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
