import prisma from "../../config/database.js";
import argon2 from "argon2";

const userSelect = { id: true, email: true, name: true, role: true, monthlyBudget: true, createdAt: true };

function assertOwnData(authUser, targetId) {
  if (authUser.role !== "ADMIN" && authUser.id !== targetId) {
    const err = new Error("Forbidden: you can only access your own data");
    err.status = 403;
    throw err;
  }
}

export async function list(authUser) {
  if (authUser.role === "ADMIN") {
    return prisma.user.findMany({ select: userSelect, orderBy: { createdAt: "desc" } });
  }
  return prisma.user.findMany({
    where: { id: authUser.id },
    select: userSelect,
  });
}

export async function getById(authUser, id) {
  assertOwnData(authUser, id);

  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user;
}

export async function create(authUser, data) {
  if (authUser.role !== "ADMIN") {
    const err = new Error("Forbidden: only admins can create users");
    err.status = 403;
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const err = new Error("Email already in use");
    err.status = 409;
    throw err;
  }

  const password = await argon2.hash(data.password);
  return prisma.user.create({
    data: { email: data.email, password, name: data.name ?? null, role: data.role ?? "OPERATOR" },
    select: userSelect,
  });
}

export async function update(authUser, id, data) {
  assertOwnData(authUser, id);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (data.role !== undefined && authUser.role !== "ADMIN") {
    const err = new Error("Forbidden: only admins can change roles");
    err.status = 403;
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

  return prisma.user.update({
    where: { id },
    data,
    select: userSelect,
  });
}

export async function remove(authUser, id) {
  assertOwnData(authUser, id);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  await prisma.user.delete({ where: { id } });
}
