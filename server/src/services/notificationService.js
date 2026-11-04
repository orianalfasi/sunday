import prisma from "../lib/prisma.js";
import AppError from "../lib/AppError.js";

export const INBOX_LIMIT = 20;

const notificationSelect = {
  id: true,
  type: true,
  title: true,
  body: true,
  read: true,
  boardId: true,
  taskId: true,
  inviteId: true,
  createdAt: true,
};

export async function trimInbox(userId, db = prisma) {
  const extra = await db.notification.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: INBOX_LIMIT,
    select: { id: true },
  });
  if (!extra.length) return;
  await db.notification.deleteMany({
    where: { id: { in: extra.map((row) => row.id) } },
  });
}

export async function createNotification(data, db = prisma) {
  const notification = await db.notification.create({ data });
  await trimInbox(data.userId, db);
  return notification;
}

export async function listNotifications(userId) {
  await trimInbox(userId);
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: INBOX_LIMIT,
    select: notificationSelect,
  });
}

export async function markRead(userId, notificationId) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) {
    throw new AppError(404, "Notification not found");
  }
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
    select: notificationSelect,
  });
}

export async function markAllRead(userId) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return { ok: true };
}
