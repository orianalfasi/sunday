export function logActivity(
  db,
  { boardId, taskId, actorId, action, entityType, entityId, meta },
) {
  return db.activityEvent.create({
    data: {
      boardId,
      taskId: taskId ?? null,
      actorId: actorId ?? null,
      action,
      entityType,
      entityId,
      meta: meta ?? undefined,
    },
  });
}
