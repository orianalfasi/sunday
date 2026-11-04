import { Router } from "express";
import validate from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../schemas/auth.js";
import requireAuth from "../middleware/requireAuth.js";
import {
  register,
  login,
  me,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

const router = Router();
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, validate(updateProfileSchema), updateProfile);
router.post(
  "/me/password",
  requireAuth,
  validate(changePasswordSchema),
  changePassword,
);
export default router;
