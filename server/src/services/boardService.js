import prisma from "../lib/prisma.js";
import AppError from "../lib/AppError.js";
import { requireMember, requireAdmin, boardSelect } from "../lib/access.js";

export async function listBoards(userId) {
  return prisma.board.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    orderBy: { createdAt: "asc" },
    select: boardSelect,
  });
}

export async function getBoard(userId, boardId) {
  await requireMember(boardId, userId);
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      ...boardSelect,
      owner: { select: { id: true, name: true } },
      members: {
        select: {
          id: true,
          role: true,
          userId: true,
          joinedAt: true,
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
    },
  });
  if (!board) {
    throw new AppError(404, "Board not found");
  }
  return board;
}

async function getBoardRecord(userId, boardId) {
  return getBoard(userId, boardId);
}

export async function updateBoard(userId, boardId, data) {
  await requireAdmin(boardId, userId);
  await prisma.board.update({
    where: { id: boardId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
    },
  });
  return getBoardRecord(userId, boardId);
}

export async function deleteBoard(userId, boardId) {
  const membership = await requireMember(boardId, userId);
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new AppError(404, "Board not found");
  if (board.type === "PERSONAL") {
    throw new AppError(403, "Cannot delete a personal board");
  }
  if (membership.role !== "OWNER") {
    throw new AppError(403, "Only the board manager can delete this board");
  }
  await prisma.board.delete({ where: { id: boardId } });
  return { ok: true };
}

export async function removeMember(userId, boardId, memberUserId) {
  await requireAdmin(boardId, userId);
  const target = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId: memberUserId } },
  });
  if (!target) throw new AppError(404, "Member not found");
  if (target.role === "OWNER") {
    throw new AppError(403, "Cannot remove the board manager");
  }
  await prisma.boardMember.delete({ where: { id: target.id } });
  return getBoardRecord(userId, boardId);
}

export async function leaveBoard(userId, boardId) {
  const membership = await requireMember(boardId, userId);
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new AppError(404, "Board not found");
  if (board.type === "PERSONAL") {
    throw new AppError(403, "Cannot leave a personal board");
  }
  if (membership.role === "OWNER") {
    throw new AppError(403, "The board manager cannot leave. Delete the board instead.");
  }
  await prisma.boardMember.delete({ where: { id: membership.id } });
  return { ok: true };
}

export async function createBoard(userId, { name, description }) {
  return prisma.board.create({
    data: {
      name,
      description: description ?? "",
      type: "TEAM",
      ownerId: userId,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
    select: boardSelect,
  });
}
