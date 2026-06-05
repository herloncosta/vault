import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
});
