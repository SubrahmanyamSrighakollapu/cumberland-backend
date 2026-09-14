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

import upload from "../config/upload.js";

const router = Router();

router.get("/", listRooms);
router.get("/:id", getRoom);

router.post(
  "/",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) return next(err);
      if (req.file && req.file.filename) {
        req.body = req.body || {};
        req.body.image = `/uploads/${req.file.filename}`;
        req.body.primaryImage = `/uploads/${req.file.filename}`;
      }
      next();
    });
  },
  createRoom
);
router.put(
  "/:id",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) return next(err);
      if (req.file && req.file.filename) {
        req.body = req.body || {};
        req.body.image = `/uploads/${req.file.filename}`;
        req.body.primaryImage = `/uploads/${req.file.filename}`;
      }
      next();
    });
  },
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
