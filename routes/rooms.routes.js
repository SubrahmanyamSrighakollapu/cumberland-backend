import { Router } from "express";
import {
  listRooms,
  getRoom,
  createRoom,
  updateRoom,
  toggleFeatured,
  togglePublish,
  deleteRoom,
} from "../controllers/rooms.controller.js";
import { authenticateJWT, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listRooms);
router.get("/:id", getRoom);

router.post(
  "/",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  createRoom
);
router.put(
  "/:id",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  updateRoom
);
router.patch(
  "/:id/toggle-featured",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  toggleFeatured
);
router.patch(
  "/:id/toggle-publish",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  togglePublish
);
router.delete(
  "/:id",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  deleteRoom
);

export default router;
