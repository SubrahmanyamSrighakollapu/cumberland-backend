import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import db from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.resolve(__dirname, "..", "uploads");

const VALID_CATEGORIES = [
  "Rooms",
  "Property",
  "Amenities",
  "Dining",
  "Experiences",
  "Local Area",
];
const VALID_MEDIA_TYPES = ["image", "video"];
const VALID_LAYOUTS = ["wide", "standard", "tall"];

function toAbsoluteUrl(relativePath) {
  if (!relativePath) return relativePath;
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  if (relativePath.startsWith("/")) return relativePath;
  return `/${relativePath}`;
}

function extractLocalFile(imageUrl) {
  if (!imageUrl) return null;
  const match = imageUrl.match(/^\/uploads\/(.+)$/);
  if (!match) return null;
  return match[1];
}

function deleteUploadedFile(relativePathFromUploads) {
  if (!relativePathFromUploads) return;
  try {
    const full = path.join(UPLOAD_DIR, relativePathFromUploads);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (_) {
    // ignore — unlink error is not critical to the API response
  }
}

function validateGalleryPayload(body, requireAll = true) {
  const errors = [];
  const pick = (val, fallback) =>
    val !== undefined && val !== null ? val : fallback;

  const title = pick(body.title, "").trim();
  const category = pick(body.category, "").trim();
  const alt = pick(body.alt, "").trim();
  const description = pick(body.description, "").trim();
  const media_type = (
    pick(body.media_type, body.mediaType, "image")
  )
    .trim()
    .toLowerCase();
  const layout = (pick(body.layout, "standard")).trim().toLowerCase();
  const route = body.route ? String(body.route).trim() : null;
  const sort_order = Number.isFinite(Number(body.sort_order))
    ? Number(body.sort_order)
    : 0;
  const is_published =
    typeof body.is_published === "boolean"
      ? body.is_published
      : body.is_published === "1" ||
        body.is_published === 1 ||
        body.is_published === "true";

  if (requireAll && !title) errors.push("title is required");
  if (requireAll && !category) errors.push("category is required");
  if (requireAll && !alt) errors.push("alt is required");
  if (category && !VALID_CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }
  if (media_type && !VALID_MEDIA_TYPES.includes(media_type)) {
    errors.push(`media_type must be one of: ${VALID_MEDIA_TYPES.join(", ")}`);
  }
  if (layout && !VALID_LAYOUTS.includes(layout)) {
    errors.push(`layout must be one of: ${VALID_LAYOUTS.join(", ")}`);
  }

  return {
    errors,
    data: {
      title,
      category,
      alt,
      description: description || null,
      media_type,
      layout,
      route: route || null,
      sort_order,
      is_published,
    },
  };
}

function formatRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    category: row.category,
    image: toAbsoluteUrl(row.image),
    alt: row.alt,
    description: row.description,
    mediaType: row.media_type,
    layout: row.layout,
    route: row.route,
    sortOrder: row.sort_order,
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const getAllGallery = async (req, res) => {
  try {
    const { category, published_only, limit, offset, sort } = req.query;

    const where = [];
    const params = [];

    if (category && category !== "All") {
      where.push("category = ?");
      params.push(category);
    }
    if (
      published_only === "true" ||
      (published_only === undefined && !req.user)
    ) {
      where.push("is_published = 1");
    }

    const orderSql =
      sort === "newest"
        ? "ORDER BY created_at DESC, sort_order ASC"
        : "ORDER BY sort_order ASC, id ASC";

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM gallery_media ${whereSql}`,
      params
    );

    let rowsSql = `SELECT * FROM gallery_media ${whereSql} ${orderSql}`;
    const rowsParams = [...params];
    if (limit !== undefined) {
      rowsSql += " LIMIT ?";
      rowsParams.push(Number(limit));
    }
    if (offset !== undefined) {
      rowsSql += " OFFSET ?";
      rowsParams.push(Number(offset));
    }

    const [rows] = await db.query(rowsSql, rowsParams);
    const items = rows.map(formatRow);

    return sendSuccess(res, { items, total }, "Gallery items retrieved");
  } catch (err) {
    console.error("getAllGallery error:", err);
    return sendError(res, "Failed to load gallery.", 500);
  }
};

export const getGalleryById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, "Invalid gallery id.", 400);

    const [rows] = await db.query("SELECT * FROM gallery_media WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return sendError(res, "Gallery item not found.", 404);

    return sendSuccess(res, formatRow(rows[0]), "Gallery item retrieved");
  } catch (err) {
    console.error("getGalleryById error:", err);
    return sendError(res, "Failed to load gallery item.", 500);
  }
};

export const createGallery = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(
        res,
        "Media file is required. Upload an image or short video (max 5 MB).",
        400
      );
    }
    const imagePath = `/uploads/${req.file.filename}`;

    const { errors, data } = validateGalleryPayload(req.body, true);
    if (errors.length > 0) {
      deleteUploadedFile(req.file.filename);
      return sendError(res, errors.join(" "), 400);
    }

    const [result] = await db.query(
      `INSERT INTO gallery_media
         (title, category, image, alt, description, media_type, layout, \`route\`, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.category,
        imagePath,
        data.alt,
        data.description,
        data.media_type,
        data.layout,
        data.route,
        data.sort_order,
        data.is_published ? 1 : 0,
      ]
    );

    const [rows] = await db.query("SELECT * FROM gallery_media WHERE id = ?", [
      result.insertId,
    ]);
    return sendSuccess(res, formatRow(rows[0]), "Gallery item created", 201);
  } catch (err) {
    if (req?.file?.filename) deleteUploadedFile(req.file.filename);
    console.error("createGallery error:", err);
    return sendError(res, "Failed to create gallery item.", 500);
  }
};

export const updateGallery = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, "Invalid gallery id.", 400);

    const [existingRows] = await db.query(
      "SELECT * FROM gallery_media WHERE id = ?",
      [id]
    );
    if (existingRows.length === 0)
      return sendError(res, "Gallery item not found.", 404);

    const { errors, data } = validateGalleryPayload(req.body, false);
    if (errors.length > 0) {
      if (req?.file?.filename) deleteUploadedFile(req.file.filename);
      return sendError(res, errors.join(" "), 400);
    }

    const existing = existingRows[0];
    const previousLocal = extractLocalFile(existing.image);

    const sets = [];
    const params = [];
    const assignIf = (col, val) => {
      if (val !== undefined && val !== "" && val !== null) {
        sets.push(`\`${col}\` = ?`);
        params.push(val);
      }
    };

    if (req.file) {
      const imagePath = `/uploads/${req.file.filename}`;
      assignIf("image", imagePath);
    }

    assignIf("title", data.title || undefined);
    assignIf("category", data.category || undefined);
    assignIf("alt", data.alt || undefined);
    assignIf("description", data.description);
    assignIf("media_type", data.media_type || undefined);
    assignIf("layout", data.layout || undefined);
    assignIf("route", data.route);
    if (data.sort_order !== undefined) {
      sets.push("`sort_order` = ?");
      params.push(data.sort_order);
    }
    sets.push("`is_published` = ?");
    params.push(data.is_published ? 1 : 0);

    if (sets.length === 0) {
      if (req?.file?.filename) deleteUploadedFile(req.file.filename);
      return sendError(res, "No valid fields to update.", 400);
    }

    params.push(id);
    await db.query(
      `UPDATE gallery_media SET ${sets.join(", ")} WHERE id = ?`,
      params
    );

    if (req.file && previousLocal) {
      deleteUploadedFile(previousLocal);
    }

    const [rows] = await db.query("SELECT * FROM gallery_media WHERE id = ?", [
      id,
    ]);
    return sendSuccess(res, formatRow(rows[0]), "Gallery item updated");
  } catch (err) {
    if (req?.file?.filename) deleteUploadedFile(req.file.filename);
    console.error("updateGallery error:", err);
    return sendError(res, "Failed to update gallery item.", 500);
  }
};

export const deleteGallery = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, "Invalid gallery id.", 400);

    const [existing] = await db.query(
      "SELECT id, image FROM gallery_media WHERE id = ?",
      [id]
    );
    if (existing.length === 0)
      return sendError(res, "Gallery item not found.", 404);

    const fileToDelete = extractLocalFile(existing[0].image);

    await db.query("DELETE FROM gallery_media WHERE id = ?", [id]);
    deleteUploadedFile(fileToDelete);

    return sendSuccess(res, { id: String(id) }, "Gallery item deleted");
  } catch (err) {
    console.error("deleteGallery error:", err);
    return sendError(res, "Failed to delete gallery item.", 500);
  }
};

export const toggleGalleryPublished = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, "Invalid gallery id.", 400);

    const [rows] = await db.query(
      "SELECT id, is_published FROM gallery_media WHERE id = ?",
      [id]
    );
    if (rows.length === 0)
      return sendError(res, "Gallery item not found.", 404);

    const nextState = rows[0].is_published ? 0 : 1;
    await db.query("UPDATE gallery_media SET is_published = ? WHERE id = ?", [
      nextState,
      id,
    ]);

    return sendSuccess(
      res,
      { id: String(id), isPublished: Boolean(nextState) },
      nextState ? "Gallery item published" : "Gallery item unpublished"
    );
  } catch (err) {
    console.error("toggleGalleryPublished error:", err);
    return sendError(res, "Failed to toggle publish state.", 500);
  }
};
