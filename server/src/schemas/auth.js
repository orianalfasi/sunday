import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export const loginSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  avatar: z.union([z.string().trim().url(), z.literal(""), z.null()]).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
