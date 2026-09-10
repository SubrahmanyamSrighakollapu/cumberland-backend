import { Router } from "express";
import {
  listFaqs,
  getFaq,
  createFaq,
  updateFaq,
  togglePublish,
  deleteFaq,
} from "../controllers/faq_items.controller.js";
import { authenticateJWT, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", listFaqs);
router.get("/:id", getFaq);

router.post(
  "/",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  createFaq
);
router.put(
  "/:id",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  updateFaq
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
  deleteFaq
);

export default router;
