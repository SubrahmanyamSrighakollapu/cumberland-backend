import { Router } from "express";
import {
  listTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  toggleFeatured,
  togglePublish,
  deleteTestimonial,
} from "../controllers/testimonials.controller.js";
import { authenticateJWT, requireRole } from "../middleware/auth.middleware.js";

import upload from "../config/upload.js";

const router = Router();

router.get("/", listTestimonials);
router.get("/:id", getTestimonial);

router.post(
  "/",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err) return next(err);
      if (req.file && req.file.filename) {
        req.body = req.body || {};
        req.body.avatar = `/uploads/${req.file.filename}`;
      }
      next();
    });
  },
  createTestimonial
);
router.put(
  "/:id",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
      if (err) return next(err);
      if (req.file && req.file.filename) {
        req.body = req.body || {};
        req.body.avatar = `/uploads/${req.file.filename}`;
      }
      next();
    });
  },
  updateTestimonial
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
  deleteTestimonial
);

export default router;
