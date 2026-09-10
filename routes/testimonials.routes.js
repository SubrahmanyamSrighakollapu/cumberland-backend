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

const router = Router();

router.get("/", listTestimonials);
router.get("/:id", getTestimonial);

router.post(
  "/",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  createTestimonial
);
router.put(
  "/:id",
  authenticateJWT,
  requireRole(["admin", "editor"]),
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
