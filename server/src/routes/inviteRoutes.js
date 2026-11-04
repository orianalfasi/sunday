import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";
import {
  acceptInvite,
  declineInvite,
} from "../controllers/inviteController.js";

const router = Router();
router.post("/:inviteId/accept", requireAuth, acceptInvite);
router.post("/:inviteId/decline", requireAuth, declineInvite);
export default router;
