import { Router } from "express";
import {
  listAmenities,
  getAmenity,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  toggleAmenityPublish,
} from "../controllers/amenities.controller.js";
import { authenticateJWT, requireRole } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/response.js";

const router = Router();

router.get("/", listAmenities);
router.get("/:id_or_slug", getAmenity);

router.options("/:id/toggle-publish", (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  return res.status(204).end();
});

const authAdminOrEditor = [
  (req, res, next) => asyncHandler(authenticateJWT)(req, res, next),
  requireRole(["admin", "editor"]),
];

router.post("/", ...authAdminOrEditor, createAmenity);
router.put("/:id", ...authAdminOrEditor, updateAmenity);
router.patch(
  "/:id/toggle-publish",
  ...authAdminOrEditor,
  asyncHandler(toggleAmenityPublish)
);
router.delete("/:id", ...authAdminOrEditor, asyncHandler(deleteAmenity));

export default router;
