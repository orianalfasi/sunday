import * as notificationService from "../services/notificationService.js";

export async function list(req, res) {
  const notifications = await notificationService.listNotifications(req.userId);
  res.json({ notifications });
}

export async function markRead(req, res) {
  const notification = await notificationService.markRead(
    req.userId,
    req.params.notificationId,
  );
  res.json({ notification });
}

export async function markAllRead(req, res) {
  const result = await notificationService.markAllRead(req.userId);
  res.json(result);
}
