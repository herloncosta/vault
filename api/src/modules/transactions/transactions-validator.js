import { z } from "zod";

function strip(schema) {
  return typeof schema.strip === "function" ? schema.strip() : schema;
}

export const createTransactionSchema = strip(z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required").max(255),
  category: z.string().max(100).optional(),
  date: z.string().datetime().or(z.string().pipe(z.coerce.date().transform((d) => d.toISOString()))),
  paymentMethod: z.string().max(50).optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
}));

export const updateTransactionSchema = strip(z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  description: z.string().min(1).max(255).optional(),
  category: z.string().max(100).optional(),
  date: z.string().datetime().or(z.string().pipe(z.coerce.date().transform((d) => d.toISOString()))).optional(),
  paymentMethod: z.string().max(50).optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]).optional(),
}));
