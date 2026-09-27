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
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.date.lte = end;
    }
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

  for (const re of recurringExpenses) {
    if (re.endDate && re.endDate < now) continue;

    const startMonth = re.startDate.getMonth() + re.startDate.getFullYear() * 12;
    const endMonth = re.endDate
      ? re.endDate.getMonth() + re.endDate.getFullYear() * 12
      : now.getMonth() + now.getFullYear() * 12 + 1;

    for (let m = startMonth; m <= endMonth; m++) {
      const year = Math.floor(m / 12);
      const month = m % 12;
      const occurrenceDate = new Date(year, month, re.dayOfMonth);

      if (occurrenceDate > now && m > endMonth - 1) break;
      if (occurrenceDate < re.startDate) continue;

      if (filters.startDate && occurrenceDate < new Date(filters.startDate)) continue;
      if (filters.endDate && occurrenceDate > new Date(filters.endDate)) continue;

      unified.push({
        id: `${re.id}_${year}_${month}`,
        userId: re.userId,
        type: re.type,
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

export async function summary(authUser, query = {}) {
  let year;
  let month;
  if (query.month) {
    const m = /^(\d{4})-(\d{2})$/.exec(query.month);
    if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) {
      const err = new Error("month must be in YYYY-MM format");
      err.status = 400;
      throw err;
    }
    year = Number(m[1]);
    month = Number(m[2]) - 1;
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
  }

  const userId = query.userId && authUser.role === "ADMIN" ? query.userId : authUser.id;

  async function totals(y, mo) {
    const start = new Date(y, mo, 1);
    const end = new Date(y, mo + 1, 1);
    const monthEnd = new Date(y, mo + 1, 0);

    const [txGroups, instSum, recurring] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId, date: { gte: start, lt: end }, status: { not: "CANCELLED" } },
        _sum: { amount: true },
      }),
      prisma.installment.aggregate({
        _sum: { amount: true },
        where: { installmentExpense: { userId }, dueDate: { gte: start, lt: end } },
      }),
      prisma.recurringExpense.findMany({
        where: {
          userId,
          active: true,
          startDate: { lte: monthEnd },
          OR: [{ endDate: null }, { endDate: { gte: start } }],
        },
        select: { type: true, amount: true, dayOfMonth: true, startDate: true, endDate: true },
      }),
    ]);

    let income = 0;
    let expense = 0;
    for (const g of txGroups) {
      if (g.type === "INCOME") income += Number(g._sum.amount ?? 0);
      else expense += Number(g._sum.amount ?? 0);
    }
    expense += Number(instSum._sum.amount ?? 0);

    const lastDay = monthEnd.getDate();
    for (const r of recurring) {
      const occurrence = new Date(y, mo, Math.min(r.dayOfMonth, lastDay));
      if (occurrence < r.startDate) continue;
      if (r.endDate && occurrence > r.endDate) continue;
      if (r.type === "INCOME") income += Number(r.amount);
      else expense += Number(r.amount);
    }

    return { income, expense, balance: income - expense };
  }

  const current = await totals(year, month);
  const prev = new Date(year, month - 1, 1);
  const previous = await totals(prev.getFullYear(), prev.getMonth());

  return {
    month: `${year}-${String(month + 1).padStart(2, "0")}`,
    current,
    previous,
  };
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
