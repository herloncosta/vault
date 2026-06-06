import { z } from "zod";

function strip(schema) {
  return typeof schema.strip === "function" ? schema.strip() : schema;
}

export const createInstallmentExpenseSchema = strip(z.object({
  description: z.string().min(1, "Description is required").max(255),
  totalAmount: z.number().positive("Total amount must be positive"),
  installmentCount: z.number().int().min(2, "Must have at least 2 installments").max(120, "Max 120 installments"),
  type: z.enum(["CREDIT_CARD", "CARNE"]),
  category: z.string().max(100).optional(),
  firstDueDate: z.string().datetime().or(z.string().pipe(z.coerce.date().transform((d) => d.toISOString()))),
}));

export const updateInstallmentExpenseSchema = strip(z.object({
  description: z.string().min(1).max(255).optional(),
  totalAmount: z.number().positive().optional(),
  installmentCount: z.number().int().min(2).max(120).optional(),
  type: z.enum(["CREDIT_CARD", "CARNE"]).optional(),
  category: z.string().max(100).optional(),
  firstDueDate: z.string().datetime().or(z.string().pipe(z.coerce.date().transform((d) => d.toISOString()))).optional(),
}));

export const updateInstallmentPaidSchema = strip(z.object({
  paid: z.boolean(),
}));
