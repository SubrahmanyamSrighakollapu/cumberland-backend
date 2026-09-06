import { Router } from "express";
import { asyncHandler } from "../utils/response.js";
import { getStats } from "../controllers/dashboard.controller.js";
import { authenticateJWT, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/dashboard/stats",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  asyncHandler(getStats)
);

router.get("/ping", (req, res) => {
  res.json({ success: true, message: "Cumberland API is online", timestamp: new Date().toISOString() });
});

export default router;
