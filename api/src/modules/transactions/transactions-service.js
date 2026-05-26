import prisma from "../../config/database.js";

const transactionInclude = { user: { select: { id: true, email: true, name: true } } };

function assertOwnData(authUser, targetUserId) {
  if (authUser.role !== "ADMIN" && authUser.id !== targetUserId) {
    const err = new Error("Forbidden: you can only access your own transactions");
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
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = new Date(filters.startDate);
    if (filters.endDate) where.date.lte = new Date(filters.endDate);
  }

  return where;
}

export async function list(authUser, query = {}) {
  const where = buildWhere(authUser, query);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: transactionInclude,
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getById(authUser, id) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: transactionInclude,
  });

  if (!transaction) {
    const err = new Error("Transaction not found");
    err.status = 404;
    throw err;
  }

  assertOwnData(authUser, transaction.userId);
  return transaction;
}

export async function create(authUser, data) {
  return prisma.transaction.create({
    data: {
      userId: authUser.id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      category: data.category ?? null,
      date: new Date(data.date),
      paymentMethod: data.paymentMethod ?? null,
      status: data.status ?? "COMPLETED",
    },
    include: transactionInclude,
  });
}

export async function update(authUser, id, data) {
  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing) {
    const err = new Error("Transaction not found");
    err.status = 404;
    throw err;
  }

  assertOwnData(authUser, existing.userId);

  const updateData = { ...data };
  if (updateData.date) updateData.date = new Date(updateData.date);

  return prisma.transaction.update({
    where: { id },
    data: updateData,
    include: transactionInclude,
  });
}

export async function remove(authUser, id) {
  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing) {
    const err = new Error("Transaction not found");
    err.status = 404;
    throw err;
  }

  assertOwnData(authUser, existing.userId);

  await prisma.transaction.delete({ where: { id } });
}
