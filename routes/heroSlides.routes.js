import { Router } from "express";
import {
  listHeroSlides,
  getHeroSlide,
  createHeroSlide,
  updateHeroSlide,
  toggleHeroSlidePublish,
  deleteHeroSlide,
} from "../controllers/heroSlides.controller.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/auth.middleware.js";
import upload from "../config/upload.js";
import config from "../config/config.js";
import { asyncHandler } from "../utils/response.js";

const router = Router();

function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const incoming = new URL(origin);
    const isLocalhost =
      incoming.hostname === "localhost" || incoming.hostname === "127.0.0.1";
    if (config.nodeEnv === "development" && isLocalhost) return true;
  } catch {
    return false;
  }
  return config.corsOriginList.some((allowed) => {
    try {
      const a = new URL(allowed);
      const b = new URL(origin);
      const aPort = a.port
        ? a.port
        : a.protocol === "https:"
          ? "443"
          : "80";
      const bPort = b.port
        ? b.port
        : b.protocol === "https:"
          ? "443"
          : "80";
      return (
        a.protocol === b.protocol && a.hostname === b.hostname && aPort === bPort
      );
    } catch {
      return false;
    }
  });
}

const authAdminOrEditor = [
  (req, res, next) => asyncHandler(authenticateJWT)(req, res, next),
  requireRole(["admin", "editor"]),
];

router.get("/", listHeroSlides);
router.get("/:id_or_slug", getHeroSlide);

router.options("/:id/toggle-publish", (req, res) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
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

router.post(
  "/",
  ...authAdminOrEditor,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          err.statusCode = 400;
          err.message = "File too large. Maximum allowed size is 5 MB.";
        } else if (err.code === "INVALID_FILE_TYPE") {
          err.statusCode = 400;
          err.message =
            "Invalid file type. Allowed formats: JPG, PNG, WebP, GIF, MP4, WebM.";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
          err.statusCode = 400;
          err.message = "Too many files uploaded. One file per request.";
        }
        return next(err);
      }
      next();
    });
  },
  createHeroSlide
);

router.put(
  "/:id",
  ...authAdminOrEditor,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          err.statusCode = 400;
          err.message = "File too large. Maximum allowed size is 5 MB.";
        } else if (err.code === "INVALID_FILE_TYPE") {
          err.statusCode = 400;
          err.message =
            "Invalid file type. Allowed formats: JPG, PNG, WebP, GIF, MP4, WebM.";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
          err.statusCode = 400;
          err.message = "Too many files uploaded. One file per request.";
        }
        return next(err);
      }
      next();
    });
  },
  updateHeroSlide
);

router.patch(
  "/:id/toggle-publish",
  ...authAdminOrEditor,
  asyncHandler(toggleHeroSlidePublish)
);

router.delete(
  "/:id",
  ...authAdminOrEditor,
  asyncHandler(deleteHeroSlide)
);

export default router;
