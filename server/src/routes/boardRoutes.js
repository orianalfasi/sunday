import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  list,
  create,
  getOne,
  update,
  remove,
  removeMember,
  leave,
} from "../controllers/boardController.js";
import validate from "../middleware/validate.js";
import {
  createBoardSchema,
  updateBoardSchema,
  inviteSchema,
} from "../schemas/board.js";
import { createInvite } from "../controllers/inviteController.js";
import { createTaskSchema } from "../schemas/task.js";
import * as taskController from "../controllers/taskController.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, validate(createBoardSchema), create);
router.get("/:boardId/tasks", requireAuth, taskController.listBoardTasks);
router.post(
  "/:boardId/tasks",
  requireAuth,
  validate(createTaskSchema),
  taskController.create,
);
router.get("/:boardId/activity", requireAuth, taskController.listActivity);
router.get("/:boardId", requireAuth, getOne);
router.patch(
  "/:boardId",
  requireAuth,
  validate(updateBoardSchema),
  update,
);
router.delete("/:boardId", requireAuth, remove);
router.delete("/:boardId/members/:userId", requireAuth, removeMember);
router.post("/:boardId/leave", requireAuth, leave);
router.post(
  "/:boardId/invites",
  requireAuth,
  validate(inviteSchema),
  createInvite,
);

export default router;
