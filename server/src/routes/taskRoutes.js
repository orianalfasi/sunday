import { Router } from "express";
import multer from "multer";
import requireAuth from "../middleware/requireAuth.js";
import validate from "../middleware/validate.js";
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  assigneeSchema,
  commentSchema,
} from "../schemas/task.js";
import * as taskController from "../controllers/taskController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.get("/", requireAuth, taskController.listAll);
router.get("/:taskId", requireAuth, taskController.getOne);
router.patch(
  "/:taskId",
  requireAuth,
  validate(updateTaskSchema),
  taskController.update,
);
router.patch(
  "/:taskId/move",
  requireAuth,
  validate(moveTaskSchema),
  taskController.move,
);
router.delete("/:taskId", requireAuth, taskController.remove);
router.post(
  "/:taskId/assignees",
  requireAuth,
  validate(assigneeSchema),
  taskController.addAssignee,
);
router.delete(
  "/:taskId/assignees/:userId",
  requireAuth,
  taskController.removeAssignee,
);
router.post(
  "/:taskId/comments",
  requireAuth,
  validate(commentSchema),
  taskController.addComment,
);
router.post(
  "/:taskId/attachments",
  requireAuth,
  upload.single("file"),
  taskController.addAttachment,
);
router.delete(
  "/attachments/:attachmentId",
  requireAuth,
  taskController.deleteAttachment,
);

export default router;
