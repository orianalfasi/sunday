import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  list,
  markRead,
  markAllRead,
} from "../controllers/notificationController.js";

const router = Router();
router.get("/", requireAuth, list);
router.post("/read-all", requireAuth, markAllRead);
router.post("/:notificationId/read", requireAuth, markRead);
export default router;
