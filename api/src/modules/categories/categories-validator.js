import { z } from "zod";

function strip(schema) {
  return typeof schema.strip === "function" ? schema.strip() : schema;
}

export const createCategorySchema = strip(z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50),
  type: z.enum(["INCOME", "EXPENSE"]),
}));

export const updateCategorySchema = strip(z.object({
  name: z.string().min(1).max(50).optional(),
}));
