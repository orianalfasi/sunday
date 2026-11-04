import prisma from "../lib/prisma.js";
import AppError from "../lib/AppError.js";
import { emitUser } from "../lib/io.js";
import { createNotification } from "./notificationService.js";

export async function deliverPendingInvites(user, db = prisma) {
  if (!user?.id || !user.email) return [];

  const pending = await db.boardInvite.findMany({
    where: { invitedEmail: user.email, status: "PENDING" },
    include: {
      board: { select: { id: true, name: true } },
      sender: { select: { name: true } },
    },
  });

  const created = [];
  for (const invite of pending) {
    const already = await db.notification.findFirst({
      where: { userId: user.id, inviteId: invite.id },
    });
    if (already) continue;

    const notification = await createNotification(
      {
        userId: user.id,
        type: "INVITE",
        title: `Invited to ${invite.board.name}`,
        body: `${invite.sender?.name ?? "Someone"} invited you to ${invite.board.name}.`,
        boardId: invite.boardId,
        inviteId: invite.id,
      },
      db,
    );
    created.push(notification);
  }
  return created;
}

export async function createInvite(userId, boardId, email) {
  const invitedEmail = email.toLowerCase();

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    throw new AppError(404, "Board not found");
  }
  if (board.type === "PERSONAL") {
    throw new AppError(403, "Cannot invite to a personal board");
  }

  const membership = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (!membership || membership.role === "MEMBER") {
    throw new AppError(403, "You cannot invite people to this board");
  }

  const caller = await prisma.user.findUnique({ where: { id: userId } });
  if (caller.email === invitedEmail) {
    throw new AppError(400, "You cannot invite yourself");
  }

  const invitedUser = await prisma.user.findUnique({
    where: { email: invitedEmail },
  });
  if (invitedUser) {
    const alreadyMember = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: invitedUser.id } },
    });
    if (alreadyMember) {
      throw new AppError(409, "User is already a member");
    }
  }

  const existingInvite = await prisma.boardInvite.findFirst({
    where: { boardId, invitedEmail, status: "PENDING" },
  });
  if (existingInvite) {
    throw new AppError(409, "Invite already sent");
  }

  const invite = await prisma.$transaction(async (tx) => {
    const created = await tx.boardInvite.create({
      data: {
        boardId,
        invitedEmail,
        invitedBy: userId,
        status: "PENDING",
      },
    });

    if (invitedUser) {
      const notification = await createNotification(
        {
          userId: invitedUser.id,
          type: "INVITE",
          title: `Invited to ${board.name}`,
          body: `${caller.name} invited you to ${board.name}.`,
          boardId,
          inviteId: created.id,
        },
        tx,
      );
      created._notification = { ...notification, userId: invitedUser.id };
    }

    return created;
  });

  if (invite._notification) {
    emitUser(invite._notification.userId, "notification:new", invite._notification);
  }

  return {
    id: invite.id,
    boardId: invite.boardId,
    invitedEmail: invite.invitedEmail,
    status: invite.status,
  };
}

export async function acceptInvite(userId, inviteId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const invite = await prisma.boardInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    throw new AppError(404, "Invite not found");
  }
  if (invite.status !== "PENDING") {
    throw new AppError(400, "Invite is no longer pending");
  }
  if (invite.invitedEmail !== user.email) {
    throw new AppError(403, "This invite is not for you");
  }

  await prisma.$transaction(async (tx) => {
    await tx.boardMember.create({
      data: {
        boardId: invite.boardId,
        userId,
        role: "MEMBER",
      },
    });
    await tx.boardInvite.update({
      where: { id: inviteId },
      data: {
        status: "ACCEPTED",
        respondedAt: new Date(),
      },
    });
  });

  return { boardId: invite.boardId };
}

export async function declineInvite(userId, inviteId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const invite = await prisma.boardInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    throw new AppError(404, "Invite not found");
  }
  if (invite.status !== "PENDING") {
    throw new AppError(400, "Invite is no longer pending");
  }
  if (invite.invitedEmail !== user.email) {
    throw new AppError(403, "This invite is not for you");
  }

  await prisma.boardInvite.update({
    where: { id: inviteId },
    data: { status: "DECLINED", respondedAt: new Date() },
  });

  return { ok: true };
}
