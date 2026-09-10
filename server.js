import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import config from "./config/config.js";
import db from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import testimonialRoutes from "./routes/testimonials.routes.js";
import faqRoutes from "./routes/faqs.routes.js";
import roomsRoutes from "./routes/rooms.routes.js";
import amenitiesRoutes from "./routes/amenities.routes.js";
import heroSlidesRoutes from "./routes/heroSlides.routes.js";
import contactInquiryRoutes from "./routes/contact-inquiries.routes.js";
import publicRoutes from "./routes/public.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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
        a.protocol === b.protocol &&
        a.hostname === b.hostname &&
        aPort === bPort
      );
    } catch {
      return false;
    }
  });
}

function attachCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (!origin) return false;
  if (!isAllowedOrigin(origin)) return false;
  if (!res.headersSent) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,PATCH,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Requested-With"
    );
    res.setHeader("Access-Control-Expose-Headers", "X-Total-Count");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
  return true;
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    attachCorsHeaders(req, res);
  }
  if (req.method === "OPTIONS") {
    const handled = origin ? attachCorsHeaders(req, res) : true;
    if (!handled && origin) {
      return res.status(403).json({
        success: false,
        message: `CORS not allowed for origin: ${origin}`,
      });
    }
    return res.status(204).end();
  }
  next();
});

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (isAllowedOrigin(origin)) return cb(null, true);
    return cb(new Error(`CORS not allowed for origin: ${origin}`), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Total-Count"],
  maxAge: 86400,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  "/uploads",
  express.static(path.resolve(__dirname, "uploads"), {
    maxAge: "7d",
    setHeaders: (res) => {
      res.setHeader(
        "Cache-Control",
        "public, max-age=604800, must-revalidate"
      );
    },
  })
);


app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 as ping");
    res.status(200).json({
      status: "ok",
      database: rows[0]?.ping === 1 ? "connected" : "disconnected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(200).json({
      status: "ok",
      database: "disconnected",
      error: err.message,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/amenities", amenitiesRoutes);
app.use("/api/hero-slides", heroSlidesRoutes);
app.use("/api/contact-inquiries", contactInquiryRoutes);
app.use("/api/contact", contactInquiryRoutes);
app.use("/api", publicRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (!res.headersSent) attachCorsHeaders(req, res);
  if (err && String(err.message || "").startsWith("CORS not allowed")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(config.nodeEnv === "development" && { stack: err.stack }),
  });
});

app.use((req, res) => {
  if (!res.headersSent) attachCorsHeaders(req, res);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n🚀 Cumberland API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment: ${config.nodeEnv}`);
  console.log(`🌐 CORS origin: ${config.corsOrigin}\n`);
});

export default app;
