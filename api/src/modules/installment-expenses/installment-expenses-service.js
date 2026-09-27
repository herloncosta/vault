import prisma from "../../config/database.js";
import { assertCategoryExists } from "../categories/categories-service.js";

const installmentExpenseInclude = {
  user: { select: { id: true, email: true, name: true } },
  installments: { orderBy: { installmentNumber: "asc" } },
};

function assertOwnData(authUser, targetUserId) {
  if (authUser.role !== "ADMIN" && authUser.id !== targetUserId) {
    const err = new Error("Forbidden: you can only access your own installment expenses");
    err.status = 403;
    throw err;
  }
}

function buildWhere(authUser, filters = {}) {
  const where = {};

  if (filters.userId && authUser.role === "ADMIN") {
    where.userId = filters.userId;
  } else {
    where.userId = authUser.id;
  }

  if (filters.type) where.type = filters.type;
  if (filters.category) where.category = filters.category;

  return where;
}

function generateInstallments(totalAmount, installmentCount, firstDueDate) {
  const totalCents = Math.round(Number(totalAmount) * 100);
  const baseCents = Math.floor(totalCents / installmentCount);
  const firstDate = new Date(firstDueDate);
  const installments = [];

  for (let i = 0; i < installmentCount; i++) {
    // Clamp to the last day of the month to avoid overflow
    // (e.g. Jan 31 + 1 month must be Feb 28, not Mar 2/3).
    const lastDay = new Date(firstDate.getFullYear(), firstDate.getMonth() + i + 1, 0).getDate();
    const dueDate = new Date(
      firstDate.getFullYear(),
      firstDate.getMonth() + i,
      Math.min(firstDate.getDate(), lastDay),
      firstDate.getHours(),
      firstDate.getMinutes(),
      firstDate.getSeconds(),
    );

    const cents = i === installmentCount - 1
      ? totalCents - baseCents * (installmentCount - 1)
      : baseCents;

    installments.push({
      amount: cents / 100,
      installmentNumber: i + 1,
      dueDate,
    });
  }

  return installments;
}

export async function list(authUser, query = {}) {
  const where = buildWhere(authUser, query);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.installmentExpense.findMany({
      where,
      include: installmentExpenseInclude,
      orderBy: { firstDueDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.installmentExpense.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getById(authUser, id) {
  const expense = await prisma.installmentExpense.findUnique({
    where: { id },
    include: installmentExpenseInclude,
  });

  if (!expense) {
    const err = new Error("Installment expense not found");
    err.status = 404;
    throw err;
  }

  assertOwnData(authUser, expense.userId);
  return expense;
}

export async function create(authUser, data) {
  await assertCategoryExists(authUser.id, data.category, "EXPENSE");
  const installments = generateInstallments(data.totalAmount, data.installmentCount, data.firstDueDate);

  return prisma.installmentExpense.create({
    data: {
      userId: authUser.id,
      description: data.description,
      totalAmount: data.totalAmount,
      installmentCount: data.installmentCount,
      type: data.type,
      category: data.category ?? null,
      firstDueDate: new Date(data.firstDueDate),
      installments: {
        create: installments,
      },
    },
    include: installmentExpenseInclude,
  });
}

export async function update(authUser, id, data) {
  const existing = await prisma.installmentExpense.findUnique({ where: { id } });

  if (!existing) {
    const err = new Error("Installment expense not found");
    err.status = 404;
    throw err;
  }

  assertOwnData(authUser, existing.userId);

  if (data.category !== undefined) {
    await assertCategoryExists(existing.userId, data.category, "EXPENSE");
  }

  if (data.totalAmount !== undefined || data.installmentCount !== undefined) {
    const err = new Error("totalAmount and installmentCount cannot be changed after creation; delete and recreate instead");
    err.status = 400;
    throw err;
  }

  const updateData = { ...data };
  if (updateData.firstDueDate) updateData.firstDueDate = new Date(updateData.firstDueDate);

  return prisma.installmentExpense.update({
    where: { id },
    data: updateData,
    include: installmentExpenseInclude,
  });
}

export async function remove(authUser, id) {
  const existing = await prisma.installmentExpense.findUnique({ where: { id } });

  if (!existing) {
    const err = new Error("Installment expense not found");
    err.status = 404;
    throw err;
  }

  assertOwnData(authUser, existing.userId);

  await prisma.installmentExpense.delete({ where: { id } });
}

export async function updateInstallmentPaid(authUser, installmentId, data) {
  const installment = await prisma.installment.findUnique({
    where: { id: installmentId },
    include: { installmentExpense: { select: { userId: true } } },
  });

  if (!installment) {
    const err = new Error("Installment not found");
    err.status = 404;
    throw err;
  }

  assertOwnData(authUser, installment.installmentExpense.userId);

  return prisma.installment.update({
    where: { id: installmentId },
    data: {
      paid: data.paid,
      paidAt: data.paid ? new Date() : null,
    },
  });
}
