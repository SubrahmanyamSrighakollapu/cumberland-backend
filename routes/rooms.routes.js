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
import upload, { uploadMultiple } from "../config/upload.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

router.post(
  "/upload-image",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return sendError(res, "File too large. Maximum allowed size is 5 MB.", 400);
        }
        return sendError(res, err.message || "Failed to upload image", 400);
      }
      if (!req.file || !req.file.filename) {
        return sendError(res, "No file uploaded", 400);
      }
      return sendSuccess(
        res,
        {
          url: `/uploads/${req.file.filename}`,
          src: `/uploads/${req.file.filename}`,
          filename: req.file.filename,
          originalName: req.file.originalname,
        },
        "Image uploaded successfully"
      );
    });
  }
);

router.post(
  "/upload-gallery",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  (req, res, next) => {
    uploadMultiple.array("images", 15)(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return sendError(res, "File too large. Maximum allowed size is 5 MB per image.", 400);
        }
        return sendError(res, err.message || "Failed to upload gallery images", 400);
      }
      const files = req.files || (req.file ? [req.file] : []);
      if (!files.length) {
        return sendError(res, "No files uploaded", 400);
      }
      const items = files.map((file) => ({
        src: `/uploads/${file.filename}`,
        alt: file.originalname ? file.originalname.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") : "",
      }));
      return sendSuccess(res, { items }, "Gallery images uploaded successfully");
    });
  }
);

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
