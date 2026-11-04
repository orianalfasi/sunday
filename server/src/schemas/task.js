import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string({ error: "Title is required" }).trim().min(1, "Title is required"),
  description: z.string().optional().default(""),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().nullable().optional(),
  position: z.number().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: z.string().nullable().optional(),
  position: z.number().optional(),
});

export const moveTaskSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED"]),
  position: z.number(),
});

export const assigneeSchema = z.object({
  userId: z.string().min(1),
});

export const commentSchema = z.object({
  body: z.string({ error: "Comment is required" }).trim().min(1, "Comment is required"),
});
