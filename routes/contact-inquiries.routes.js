import { Router } from "express";
import {
  listInquiries,
  getInquiry,
  createInquiry,
  updateStatus,
  deleteInquiry,
} from "../controllers/contact_inquiries.controller.js";
import { authenticateJWT, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

function isAllowedOrigin(origin) {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ];
  if (!origin) return false;
  try {
    const a = new URL(origin);
    for (const raw of allowedOrigins) {
      const b = new URL(raw);
      const aPort = a.port || (a.protocol === "http:" ? "80" : "443");
      const bPort = b.port || (b.protocol === "http:" ? "80" : "443");
      if (
        a.protocol === b.protocol &&
        a.hostname === b.hostname &&
        aPort === bPort
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

router.options("/:id/status", (req, res) => {
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

router.post("/", createInquiry);

router.get(
  "/",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  listInquiries
);
router.get(
  "/:id",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  getInquiry
);
router.patch(
  "/:id/status",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  updateStatus
);
router.delete(
  "/:id",
  authenticateJWT,
  requireRole(["admin", "editor"]),
  deleteInquiry
);

export default router;
