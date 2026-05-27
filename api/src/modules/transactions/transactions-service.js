import prisma from "../../config/database.js";

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
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const userId = query.userId && authUser.role === "ADMIN" ? query.userId : authUser.id;

  const unified = [];

  const filters = {
    type: query.type,
    status: query.status,
    category: query.category,
    startDate: query.startDate,
    endDate: query.endDate,
  };

  const transactionWhere = buildWhere(authUser, query);
  delete transactionWhere.userId;
  transactionWhere.userId = userId;

  const transactions = await prisma.transaction.findMany({
    where: transactionWhere,
    orderBy: { date: "desc" },
  });

  for (const t of transactions) {
    unified.push({
      id: t.id,
      userId: t.userId,
      type: t.type,
      amount: Number(t.amount),
      description: t.description,
      category: t.category,
      date: t.date.toISOString(),
      paymentMethod: t.paymentMethod,
      status: t.status,
      source: "transaction",
      sourceId: null,
      installmentNumber: null,
      installmentCount: null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    });
  }

  const installmentExpenses = await prisma.installmentExpense.findMany({
    where: { userId },
    include: { installments: true },
  });

  for (const ie of installmentExpenses) {
    if (filters.category && ie.category !== filters.category) continue;

    for (const inst of ie.installments) {
      if (filters.startDate && new Date(inst.dueDate) < new Date(filters.startDate)) continue;
      if (filters.endDate && new Date(inst.dueDate) > new Date(filters.endDate)) continue;

      const instStatus = inst.paid ? "COMPLETED" : "PENDING";
      if (filters.status && instStatus !== filters.status) continue;

      unified.push({
        id: inst.id,
        userId: ie.userId,
        type: "EXPENSE",
        amount: Number(inst.amount),
        description: ie.description,
        category: ie.category,
        date: inst.dueDate.toISOString(),
        paymentMethod: ie.type === "CREDIT_CARD" ? "Cartão de Crédito" : "Carnê",
        status: instStatus,
        source: "installment",
        sourceId: ie.id,
        installmentNumber: inst.installmentNumber,
        installmentCount: ie.installmentCount,
        createdAt: inst.createdAt.toISOString(),
        updatedAt: null,
      });
    }
  }

  const recurringWhere = { userId, active: true };
  if (filters.category) recurringWhere.category = filters.category;

  const recurringExpenses = await prisma.recurringExpense.findMany({ where: recurringWhere });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  for (const re of recurringExpenses) {
    if (re.endDate && re.endDate < now) continue;
    if (re.startDate > now) continue;

    let occurrenceDate = new Date(currentYear, currentMonth, re.dayOfMonth);
    if (occurrenceDate < now) {
      occurrenceDate.setMonth(occurrenceDate.getMonth() + 1);
    }

    if (filters.startDate && occurrenceDate < new Date(filters.startDate)) continue;
    if (filters.endDate && occurrenceDate > new Date(filters.endDate)) continue;

    unified.push({
      id: re.id,
      userId: re.userId,
      type: "EXPENSE",
      amount: Number(re.amount),
      description: re.description,
      category: re.category,
      date: occurrenceDate.toISOString(),
      paymentMethod: re.paymentMethod,
      status: "PENDING",
      source: "recurring",
      sourceId: re.id,
      installmentNumber: null,
      installmentCount: null,
      createdAt: re.createdAt.toISOString(),
      updatedAt: null,
    });
  }

  if (filters.type) {
    const filtered = unified.filter((item) => item.type === filters.type);
    unified.length = 0;
    unified.push(...filtered);
  }

  if (filters.status) {
    const filtered = unified.filter((item) => item.status === filters.status);
    unified.length = 0;
    unified.push(...filtered);
  }

  unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = unified.length;
  const data = unified.slice(skip, skip + limit);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getById(authUser, id) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
  });

  if (!transaction) {
    const err = new Error("Transaction not found");
    err.status = 404;
    throw err;
  }

  assertOwnData(authUser, transaction.userId);
  return {
    ...transaction,
    amount: Number(transaction.amount),
    source: "transaction",
    sourceId: null,
    installmentNumber: null,
    installmentCount: null,
  };
}

export async function create(authUser, data) {
  const transaction = await prisma.transaction.create({
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
  });

  return {
    ...transaction,
    amount: Number(transaction.amount),
    source: "transaction",
    sourceId: null,
    installmentNumber: null,
    installmentCount: null,
  };
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

  const transaction = await prisma.transaction.update({
    where: { id },
    data: updateData,
  });

  return {
    ...transaction,
    amount: Number(transaction.amount),
    source: "transaction",
    sourceId: null,
    installmentNumber: null,
    installmentCount: null,
  };
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
