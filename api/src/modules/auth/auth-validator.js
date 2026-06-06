import { z } from "zod";

function strip(schema) {
  return typeof schema.strip === "function" ? schema.strip() : schema;
}

export const registerSchema = strip(z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
}));

export const loginSchema = strip(z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
}));

export const refreshTokenSchema = strip(z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
}));

export const updateProfileSchema = strip(z
  .object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    currentPassword: z.string().min(1, "Current password is required").optional(),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password && !data.currentPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["currentPassword"],
        message: "Current password is required to set a new password",
      });
    }
  }));
