import prisma from "../../config/database.js";
import argon2 from "argon2";

const userSelect = { id: true, email: true, name: true, role: true, monthlyBudget: true, createdAt: true };

export async function list() {
  return prisma.user.findMany({ select: userSelect, orderBy: { createdAt: "desc" } });
}

export async function getById(id) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user;
}

export async function create(data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const err = new Error("Email already in use");
    err.status = 409;
    throw err;
  }

  const password = await argon2.hash(data.password);
  const user = await prisma.user.create({
    data: { email: data.email, password, name: data.name ?? null, role: data.role ?? "OPERATOR" },
    select: userSelect,
  });

  const defaultCategories = [
    { name: "Salário", type: "INCOME" },
    { name: "Freelance", type: "INCOME" },
    { name: "Aluguel", type: "INCOME" },
    { name: "Investimentos", type: "INCOME" },
    { name: "Outro", type: "INCOME" },
    { name: "Alimentação", type: "EXPENSE" },
    { name: "Transporte", type: "EXPENSE" },
    { name: "Moradia", type: "EXPENSE" },
    { name: "Compras", type: "EXPENSE" },
    { name: "Saúde", type: "EXPENSE" },
    { name: "Educação", type: "EXPENSE" },
    { name: "Lazer", type: "EXPENSE" },
    { name: "Viagem", type: "EXPENSE" },
    { name: "Assinaturas", type: "EXPENSE" },
    { name: "Seguros", type: "EXPENSE" },
    { name: "Utilidades", type: "EXPENSE" },
    { name: "Outro", type: "EXPENSE" },
  ];

  await prisma.category.createMany({
    data: defaultCategories.map((c) => ({ userId: user.id, name: c.name, type: c.type })),
  });

  return user;
}

export async function update(id, data) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      const err = new Error("Email already in use");
      err.status = 409;
      throw err;
    }
  }

  const updateData = { ...data };
  if (updateData.password) {
    updateData.password = await argon2.hash(updateData.password);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: userSelect,
  });
}

export async function remove(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  await prisma.user.delete({ where: { id } });
}
