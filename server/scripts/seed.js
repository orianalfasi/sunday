import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../src/lib/prisma.js";

const DEMO_PASSWORD = "Demo1234!";

async function upsertUser(name, email) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { name, passwordHash },
    });
  }
  return prisma.user.create({
    data: { name, email, passwordHash },
  });
}

async function ensurePersonalBoard(user) {
  const existing = await prisma.board.findFirst({
    where: { ownerId: user.id, type: "PERSONAL" },
  });
  if (existing) return existing;
  return prisma.board.create({
    data: {
      name: "Personal",
      type: "PERSONAL",
      ownerId: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
}

async function main() {
  const demo = await upsertUser("Demo User", "demo@sunday.app");
  const noa = await upsertUser("Noa Cohen", "noa@sunday.app");

  const personal = await ensurePersonalBoard(demo);
  await ensurePersonalBoard(noa);

  let marketing = await prisma.board.findFirst({
    where: { ownerId: demo.id, type: "TEAM", name: "Marketing" },
  });
  if (!marketing) {
    marketing = await prisma.board.create({
      data: {
        name: "Marketing",
        description: "Campaigns, copy, and launch checklist",
        type: "TEAM",
        ownerId: demo.id,
        members: {
          create: [
            { userId: demo.id, role: "OWNER" },
            { userId: noa.id, role: "MEMBER" },
          ],
        },
      },
    });
  }

  const existingTasks = await prisma.task.count({ where: { boardId: marketing.id } });
  if (existingTasks === 0) {
    const launch = await prisma.task.create({
      data: {
        title: "Draft launch announcement",
        description: "Write the Sunday launch post for LinkedIn and the landing page.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
        position: 1,
        boardId: marketing.id,
        createdBy: demo.id,
        assignees: { create: { userId: demo.id } },
        comments: {
          create: {
            authorId: noa.id,
            body: "Keep it short — one paragraph and a screenshot.",
          },
        },
      },
    });

    await prisma.task.create({
      data: {
        title: "Collect product screenshots",
        description: "Kanban, task panel, and inbox — light theme only.",
        status: "OPEN",
        priority: "MEDIUM",
        position: 1,
        boardId: marketing.id,
        createdBy: noa.id,
        assignees: { create: { userId: noa.id } },
      },
    });

    await prisma.task.create({
      data: {
        title: "Archive old campaign notes",
        description: "",
        status: "COMPLETED",
        priority: "LOW",
        position: 1,
        boardId: marketing.id,
        createdBy: demo.id,
      },
    });

    await prisma.task.create({
      data: {
        title: "Buy domain",
        description: "Personal reminder — not a team task.",
        status: "OPEN",
        priority: "LOW",
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        position: 1,
        boardId: personal.id,
        createdBy: demo.id,
      },
    });

    await prisma.activityEvent.create({
      data: {
        boardId: marketing.id,
        taskId: launch.id,
        actorId: demo.id,
        action: "created",
        entityType: "task",
        entityId: launch.id,
        meta: { title: launch.title },
      },
    });
  }

  console.log("Seeded demo users:");
  console.log("  demo@sunday.app / Demo1234!");
  console.log("  noa@sunday.app  / Demo1234!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
