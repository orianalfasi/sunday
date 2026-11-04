import { z } from "zod";

export const createBoardSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name is required"),
  description: z.string().trim().optional(),
});
export const updateBoardSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  description: z.string().optional(),
});

export const inviteSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .email("Valid email is required"),
});
