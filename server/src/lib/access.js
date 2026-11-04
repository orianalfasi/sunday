import prisma from "./prisma.js";
import AppError from "./AppError.js";

export async function getMembership(boardId, userId) {
  return prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
}

export async function requireMember(boardId, userId) {
  const membership = await getMembership(boardId, userId);
  if (!membership) {
    throw new AppError(403, "You are not a member of this board");
  }
  return membership;
}

export async function requireAdmin(boardId, userId) {
  const membership = await requireMember(boardId, userId);
  if (membership.role === "MEMBER") {
    throw new AppError(403, "You need admin access");
  }
  return membership;
}

export const boardSelect = {
  id: true,
  name: true,
  description: true,
  type: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
};
