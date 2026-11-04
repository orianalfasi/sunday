import cron from "node-cron";
import prisma from "../lib/prisma.js";
import { emitUser } from "../lib/io.js";
import { createNotification } from "../services/notificationService.js";

export async function runDueDateScan() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { not: null },
      status: { not: "COMPLETED" },
    },
    include: {
      assignees: true,
    },
  });

  for (const task of tasks) {
    const type =
      task.dueDate < now ? "OVERDUE" : task.dueDate <= in24h ? "DUE_SOON" : null;
    if (!type) continue;

    const recipientIds = task.assignees.length
      ? [...new Set(task.assignees.map((row) => row.userId))]
      : task.createdBy
        ? [task.createdBy]
        : [];

    for (const userId of recipientIds) {
      const existing = await prisma.notification.findFirst({
        where: { userId, taskId: task.id, type },
      });
      if (existing) continue;

      const created = await createNotification({
        userId,
        type,
        title: task.title,
        body:
          type === "OVERDUE"
            ? `"${task.title}" is past its due date.`
            : `"${task.title}" is due within 24 hours.`,
        boardId: task.boardId,
        taskId: task.id,
      });
      emitUser(userId, "notification:new", created);
    }
  }
}

export function startDueDateJobs() {
  const run = () => {
    runDueDateScan().catch((err) => {
      console.error("Due-date scan failed:", err);
    });
  };
  setTimeout(run, 3000);
  cron.schedule("*/10 * * * *", run);
}
