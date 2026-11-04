import prisma from "../lib/prisma.js";
import AppError from "../lib/AppError.js";
import { requireMember, getMembership } from "../lib/access.js";
import { logActivity } from "../lib/activity.js";
import { emitBoard, emitUser } from "../lib/io.js";
import {
  cloudinary,
  isCloudinaryConfigured,
} from "../lib/cloudinary.js";
import { createNotification } from "./notificationService.js";

const taskInclude = {
  assignees: {
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  },
  comments: {
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, email: true, avatar: true } },
    },
  },
  attachments: { orderBy: { createdAt: "asc" } },
  creator: { select: { id: true, name: true, email: true } },
};

function serializeTask(task) {
  return {
    ...task,
    assignees: task.assignees.map((row) => row.user),
  };
}

function parseDueDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, "Invalid due date");
  }
  return date;
}

async function notifyAssignment({ assigneeId, actorId, task, boardId }) {
  if (!assigneeId || assigneeId === actorId) return;
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { name: true },
  });
  const notification = await createNotification({
    userId: assigneeId,
    type: "ASSIGNED",
    title: task.title,
    body: `${actor?.name ?? "Someone"} assigned you to this task.`,
    boardId,
    taskId: task.id,
  });
  emitUser(assigneeId, "notification:new", notification);
}

async function notifyTaskWatchers({ actorId, boardId, task, type, body }) {
  const [actor, board, assignees] = await Promise.all([
    prisma.user.findUnique({
      where: { id: actorId },
      select: { name: true },
    }),
    prisma.board.findUnique({
      where: { id: boardId },
      select: { ownerId: true },
    }),
    prisma.taskAssignee.findMany({
      where: { taskId: task.id },
      select: { userId: true },
    }),
  ]);

  const recipientIds = [
    ...new Set(
      [...assignees.map((row) => row.userId), board?.ownerId].filter(
        (id) => id && id !== actorId,
      ),
    ),
  ];

  const actorName = actor?.name ?? "Someone";
  for (const userId of recipientIds) {
    const notification = await createNotification({
      userId,
      type,
      title: task.title,
      body: body(actorName),
      boardId,
      taskId: task.id,
    });
    emitUser(userId, "notification:new", notification);
  }
}

async function assertAssigneesAreMembers(boardId, assigneeIds) {
  if (!assigneeIds?.length) return;
  const members = await prisma.boardMember.findMany({
    where: { boardId, userId: { in: assigneeIds } },
    select: { userId: true },
  });
  if (members.length !== new Set(assigneeIds).size) {
    throw new AppError(400, "Assignee must be a board member");
  }
}

async function getTaskForMember(userId, taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude,
  });
  if (!task) throw new AppError(404, "Task not found");
  await requireMember(task.boardId, userId);
  return task;
}

export async function listBoardTasks(userId, boardId) {
  await requireMember(boardId, userId);
  const tasks = await prisma.task.findMany({
    where: { boardId },
    orderBy: [{ status: "asc" }, { position: "asc" }],
    include: taskInclude,
  });
  return tasks.map(serializeTask);
}

export async function listAllTasks(userId, query) {
  const { status, priority, boardId, q, page = "1", limit = "20" } = query;
  const take = Math.min(Number(limit) || 20, 50);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const where = {
    board: { members: { some: { userId } } },
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(boardId ? { boardId } : {}),
    ...(q
      ? { title: { contains: q } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
      include: {
        board: { select: { id: true, name: true, type: true } },
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    items: items.map((task) => ({
      ...task,
      assignees: task.assignees.map((row) => row.user),
    })),
    total,
    page: Number(page) || 1,
    limit: take,
  };
}

export async function getTask(userId, taskId) {
  const task = await getTaskForMember(userId, taskId);
  return serializeTask(task);
}

export async function createTask(userId, boardId, data) {
  await requireMember(boardId, userId);
  await assertAssigneesAreMembers(boardId, data.assigneeIds);
  const max = await prisma.task.aggregate({
    where: { boardId, status: data.status ?? "OPEN" },
    _max: { position: true },
  });

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        title: data.title,
        description: data.description ?? "",
        status: data.status ?? "OPEN",
        priority: data.priority ?? "LOW",
        dueDate: parseDueDate(data.dueDate) ?? null,
        position: data.position ?? (max._max.position ?? 0) + 1,
        boardId,
        createdBy: userId,
        assignees: data.assigneeIds?.length
          ? { create: data.assigneeIds.map((id) => ({ userId: id })) }
          : undefined,
      },
      include: taskInclude,
    });
    await logActivity(tx, {
      boardId,
      taskId: created.id,
      actorId: userId,
      action: "created",
      entityType: "task",
      entityId: created.id,
      meta: { title: created.title },
    });
    return created;
  });

  const serialized = serializeTask(task);
  emitBoard(boardId, "task:created", serialized);
  for (const assigneeId of data.assigneeIds ?? []) {
    await notifyAssignment({
      assigneeId,
      actorId: userId,
      task: serialized,
      boardId,
    });
  }
  return serialized;
}

export async function updateTask(userId, taskId, data) {
  const existing = await getTaskForMember(userId, taskId);
  const task = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.dueDate !== undefined ? { dueDate: parseDueDate(data.dueDate) } : {}),
        ...(data.position !== undefined ? { position: data.position } : {}),
      },
      include: taskInclude,
    });
    await logActivity(tx, {
      boardId: existing.boardId,
      taskId,
      actorId: userId,
      action: "updated",
      entityType: "task",
      entityId: taskId,
    });
    return updated;
  });
  const serialized = serializeTask(task);
  emitBoard(existing.boardId, "task:updated", serialized);
  return serialized;
}

export async function moveTask(userId, taskId, { status, position }) {
  const existing = await getTaskForMember(userId, taskId);
  const task = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: taskId },
      data: { status, position },
      include: taskInclude,
    });
    await logActivity(tx, {
      boardId: existing.boardId,
      taskId,
      actorId: userId,
      action: "moved",
      entityType: "task",
      entityId: taskId,
      meta: { from: existing.status, to: status },
    });
    return updated;
  });
  const serialized = serializeTask(task);
  emitBoard(existing.boardId, "task:moved", serialized);
  return serialized;
}

export async function deleteTask(userId, taskId) {
  const existing = await getTaskForMember(userId, taskId);
  await prisma.task.delete({ where: { id: taskId } });
  emitBoard(existing.boardId, "task:deleted", { id: taskId, boardId: existing.boardId });
  return { ok: true };
}

export async function addAssignee(userId, taskId, assigneeId) {
  const task = await getTaskForMember(userId, taskId);
  const member = await getMembership(task.boardId, assigneeId);
  if (!member) {
    throw new AppError(400, "Assignee must be a board member");
  }
  try {
    await prisma.taskAssignee.create({
      data: { taskId, userId: assigneeId },
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new AppError(409, "User is already assigned");
    }
    throw err;
  }
  const updated = await getTask(userId, taskId);
  emitBoard(task.boardId, "task:updated", updated);
  await notifyAssignment({
    assigneeId,
    actorId: userId,
    task: updated,
    boardId: task.boardId,
  });
  return updated;
}

export async function removeAssignee(userId, taskId, assigneeId) {
  const task = await getTaskForMember(userId, taskId);
  await prisma.taskAssignee.deleteMany({
    where: { taskId, userId: assigneeId },
  });
  const updated = await getTask(userId, taskId);
  emitBoard(task.boardId, "task:updated", updated);
  return updated;
}

export async function addComment(userId, taskId, body) {
  const task = await getTaskForMember(userId, taskId);
  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.taskComment.create({
      data: { taskId, authorId: userId, body },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
    await logActivity(tx, {
      boardId: task.boardId,
      taskId,
      actorId: userId,
      action: "commented",
      entityType: "comment",
      entityId: created.id,
    });
    return created;
  });
  emitBoard(task.boardId, "task:comment", { taskId, comment });
  await notifyTaskWatchers({
    actorId: userId,
    boardId: task.boardId,
    task,
    type: "COMMENT",
    body: (actorName) => {
      const preview = body.length > 80 ? `${body.slice(0, 80)}…` : body;
      return `${actorName} commented: ${preview}`;
    },
  });
  return comment;
}

export async function addAttachment(userId, taskId, file) {
  const task = await getTaskForMember(userId, taskId);
  if (!file) throw new AppError(400, "Photo is required");
  if (!file.mimetype?.startsWith("image/")) {
    throw new AppError(400, "Only photos can be uploaded");
  }
  if (!isCloudinaryConfigured()) {
    throw new AppError(503, "Photo uploads are not configured");
  }
  const uploaded = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "sunday", resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(file.buffer);
  });
  const attachment = await prisma.taskAttachment.create({
    data: {
      taskId,
      uploadedBy: userId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      resourceType: uploaded.resource_type || "image",
      size: file.size,
    },
  });
  emitBoard(task.boardId, "task:updated", await getTask(userId, taskId));
  await notifyTaskWatchers({
    actorId: userId,
    boardId: task.boardId,
    task,
    type: "PHOTO",
    body: (actorName) => `${actorName} added a photo to this task.`,
  });
  return attachment;
}

export async function deleteAttachment(userId, attachmentId) {
  const attachment = await prisma.taskAttachment.findUnique({
    where: { id: attachmentId },
  });
  if (!attachment) throw new AppError(404, "Attachment not found");
  const task = await getTaskForMember(userId, attachment.taskId);
  if (attachment.publicId && isCloudinaryConfigured()) {
    await cloudinary.uploader.destroy(attachment.publicId);
  }
  await prisma.taskAttachment.delete({ where: { id: attachmentId } });
  emitBoard(task.boardId, "task:updated", await getTask(userId, attachment.taskId));
  return { ok: true };
}

export async function listActivity(userId, boardId) {
  await requireMember(boardId, userId);
  return prisma.activityEvent.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: { select: { id: true, name: true, email: true } },
    },
  });
}
