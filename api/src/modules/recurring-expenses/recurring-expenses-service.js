import prisma from "../../config/database.js";

const recurringExpenseInclude = { user: { select: { id: true, email: true, name: true } } };

function assertOwnData(authUser, targetUserId) {
  if (authUser.role !== "ADMIN" && authUser.id !== targetUserId) {
    const err = new Error("Forbidden: you can only access your own recurring expenses");
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

  if (filters.active !== undefined) where.active = filters.active === "true";
  if (filters.category) where.category = filters.category;
  if (filters.type) where.type = filters.type;

  return where;
}

export async function list(authUser, query = {}) {
  const where = buildWhere(authUser, query);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.recurringExpense.findMany({
      where,
      include: recurringExpenseInclude,
      orderBy: { startDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.recurringExpense.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getById(authUser, id) {
  const expense = await prisma.recurringExpense.findUnique({
    where: { id },
    include: recurringExpenseInclude,
  });

  if (!expense) {
    const err = new Error("Recurring expense not found");
    err.status = 404;
    throw err;
  }

  assertOwnData(authUser, expense.userId);
  return expense;
}

export async function create(authUser, data) {
  return prisma.recurringExpense.create({
    data: {
      userId: authUser.id,
      type: data.type ?? "EXPENSE",
      amount: data.amount,
      description: data.description,
      category: data.category ?? null,
      paymentMethod: data.paymentMethod ?? null,
      dayOfMonth: data.dayOfMonth,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: recurringExpenseInclude,
  });
}

export async function update(authUser, id, data) {
  const existing = await prisma.recurringExpense.findUnique({ where: { id } });

  if (!existing) {
    const err = new Error("Recurring expense not found");
    err.status = 404;
    throw err;
  }

  assertOwnData(authUser, existing.userId);

  const updateData = { ...data };
  if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
  if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

  return prisma.recurringExpense.update({
    where: { id },
    data: updateData,
    include: recurringExpenseInclude,
  });
}

export async function remove(authUser, id) {
  const existing = await prisma.recurringExpense.findUnique({ where: { id } });

  if (!existing) {
    const err = new Error("Recurring expense not found");
    err.status = 404;
    throw err;
  }

  assertOwnData(authUser, existing.userId);

  await prisma.recurringExpense.delete({ where: { id } });
}
