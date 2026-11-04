import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import AppError from "../lib/AppError.js";
import { emitUser } from "../lib/io.js";
import { deliverPendingInvites } from "./inviteService.js";

export async function register({ name, email, password }) {
  //turns the password into passwordHash. 10 is how expensive the hash is.
  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  try {
    //one new row. email.toLowerCase() so Orian@... and orian@... are the same account.
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
        },
      });
      await tx.board.create({
        data: {
          name: "Personal",
          type: "PERSONAL",
          ownerId: created.id,
          members: {
            create: { userId: created.id, role: "OWNER" },
          },
        },
      });
      await deliverPendingInvites(created, tx);
      return created;
    });
  } catch (err) {
    //Prisma’s “unique constraint failed” (your @unique on email). You throw 409 instead of a 500.
    if (err.code === "P2002") {
      throw new AppError(409, "Email already in use");
    }
    throw err;
  }

  return toAuthResult(user);
}

function toAuthResult(user) {
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email },
  };
}
export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user || !user.passwordHash) {
    throw new AppError(401, "Invalid email or password");
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, "Invalid email or password");
  }
  const notifications = await deliverPendingInvites(user);
  for (const notification of notifications) {
    emitUser(user.id, "notification:new", notification);
  }
  return toAuthResult(user);
}

const publicUser = {
  id: true,
  name: true,
  email: true,
  avatar: true,
};

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUser,
  });
  if (!user) {
    throw new AppError(401, "User not found");
  }
  const notifications = await deliverPendingInvites(user);
  for (const notification of notifications) {
    emitUser(user.id, "notification:new", notification);
  }
  return user;
}

export async function updateProfile(userId, { name, avatar }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(avatar !== undefined ? { avatar: avatar || null } : {}),
    },
    select: publicUser,
  });
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) {
    throw new AppError(400, "Password cannot be changed for this account");
  }
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    throw new AppError(401, "Current password is incorrect");
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
  return { ok: true };
}
