import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../config/database.js";
import config from "../config/config.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, "Email and password are required.", 400);
  }

  try {
    const [users] = await db.query(
      "SELECT id, name, email, password, role, is_active FROM admin_users WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return sendError(res, "Invalid email or password.", 401);
    }

    const user = users[0];

    if (!user.is_active) {
      return sendError(res, "This account has been disabled. Contact support.", 403);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, "Invalid email or password.", 401);
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    );

    await db.query(
      "UPDATE admin_users SET last_login_at = NOW() WHERE id = ?",
      [user.id]
    );

    return sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      "Login successful"
    );
  } catch (err) {
    console.error("Login error:", err);
    return sendError(res, "Server error during login.", 500);
  }
};

export const getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, name, email, role, created_at, last_login_at FROM admin_users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return sendError(res, "User not found.", 404);
    }

    return sendSuccess(res, users[0], "Profile retrieved");
  } catch (err) {
    console.error("GetMe error:", err);
    return sendError(res, "Failed to retrieve profile.", 500);
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return sendError(res, "All password fields are required.", 400);
  }

  if (newPassword.length < 8) {
    return sendError(res, "New password must be at least 8 characters.", 400);
  }

  if (newPassword !== confirmPassword) {
    return sendError(res, "New password and confirmation do not match.", 400);
  }

  try {
    const [users] = await db.query(
      "SELECT password FROM admin_users WHERE id = ?",
      [req.user.id]
    );

    const user = users[0];
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return sendError(res, "Current password is incorrect.", 401);
    }

    const hashed = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    await db.query("UPDATE admin_users SET password = ? WHERE id = ?", [
      hashed,
      req.user.id,
    ]);

    return sendSuccess(res, null, "Password updated successfully.");
  } catch (err) {
    console.error("ChangePassword error:", err);
    return sendError(res, "Failed to update password.", 500);
  }
};
