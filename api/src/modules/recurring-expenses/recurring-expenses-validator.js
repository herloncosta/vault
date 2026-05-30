import { z } from "zod";

export const createRecurringExpenseSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required").max(255),
  category: z.string().max(100).optional(),
  paymentMethod: z.string().max(50).optional(),
  dayOfMonth: z.number().int().min(1, "Day must be between 1 and 28").max(28, "Day must be between 1 and 28"),
  startDate: z.string().datetime().or(z.string().pipe(z.coerce.date().transform((d) => d.toISOString()))),
  endDate: z.string().datetime().or(z.string().pipe(z.coerce.date().transform((d) => d.toISOString()))).optional(),
});

export const updateRecurringExpenseSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  description: z.string().min(1).max(255).optional(),
  category: z.string().max(100).optional(),
  paymentMethod: z.string().max(50).optional(),
  dayOfMonth: z.number().int().min(1).max(28).optional(),
  startDate: z.string().datetime().or(z.string().pipe(z.coerce.date().transform((d) => d.toISOString()))).optional(),
  endDate: z.string().datetime().or(z.string().pipe(z.coerce.date().transform((d) => d.toISOString()))).optional(),
  active: z.boolean().optional(),
});
