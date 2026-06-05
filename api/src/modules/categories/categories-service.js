import prisma from "../../config/database.js";

export async function list(authUser, query = {}) {
  const where = { userId: authUser.id };
  if (query.type) where.type = query.type;

  return prisma.category.findMany({
    where,
    orderBy: { name: "asc" },
  });
}

export async function getById(authUser, id) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category || category.userId !== authUser.id) {
    const err = new Error("Category not found");
    err.status = 404;
    throw err;
  }
  return category;
}

export async function create(authUser, data) {
  const existing = await prisma.category.findUnique({
    where: { userId_name_type: { userId: authUser.id, name: data.name, type: data.type } },
  });
  if (existing) {
    const err = new Error("Já existe uma categoria com este nome e tipo");
    err.status = 409;
    throw err;
  }

  return prisma.category.create({
    data: { userId: authUser.id, name: data.name, type: data.type },
  });
}

export async function update(authUser, id, data) {
  const existing = await getById(authUser, id);

  if (data.name) {
    const duplicate = await prisma.category.findFirst({
      where: {
        userId: authUser.id,
        name: data.name,
        type: existing.type,
        id: { not: id },
      },
    });
    if (duplicate) {
      const err = new Error("Já existe uma categoria com este nome");
      err.status = 409;
      throw err;
    }
  }

  return prisma.category.update({ where: { id }, data: { name: data.name } });
}

export async function remove(authUser, id) {
  await getById(authUser, id);
  await prisma.category.delete({ where: { id } });
}
