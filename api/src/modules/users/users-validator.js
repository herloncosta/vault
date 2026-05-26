import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
  role: z.enum(["ADMIN", "OPERATOR"]).optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.enum(["ADMIN", "OPERATOR"]).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});
