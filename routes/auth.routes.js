import { Router } from "express";
import { asyncHandler } from "../utils/response.js";
import { login, getMe, changePassword } from "../controllers/auth.controller.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", asyncHandler(login));
router.get("/me", authenticateJWT, asyncHandler(getMe));
router.patch("/change-password", authenticateJWT, asyncHandler(changePassword));

export default router;
