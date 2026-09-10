import jwt from "jsonwebtoken";
import config from "../config/config.js";
import db from "../config/database.js";

export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader =
      req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !String(authHeader).startsWith("Bearer ")) {
      if (res.headersSent) return next();
      return res.status(401).json({
        success: false,
        message: "Authentication required. No token provided.",
      });
    }

    const token = String(authHeader).split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtErr) {
      if (res.headersSent) return next();
      if (jwtErr.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please sign in again.",
          expired: true,
        });
      }
      if (
        jwtErr.name === "JsonWebTokenError" ||
        jwtErr.name === "NotBeforeError" ||
        jwtErr.name === "SyntaxError"
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid token. Please sign in again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Authentication failed.",
      });
    }

    const [users] = await db.query(
      "SELECT id, name, email, role, created_at FROM admin_users WHERE id = ? AND is_active = 1",
      [decoded.userId]
    );

    if (users.length === 0) {
      if (res.headersSent) return next();
      return res.status(401).json({
        success: false,
        message: "Invalid or revoked token.",
      });
    }

    req.user = users[0];
    next();
  } catch (err) {
    if (res.headersSent) return next(err);
    return res.status(401).json({
      success: false,
      message: "Authentication error.",
    });
  }
};

export const requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Insufficient permissions.",
    });
  }
  next();
};
