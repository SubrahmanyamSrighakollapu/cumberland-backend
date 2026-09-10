import db from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";

function validateTestimonialPayload(body, requireAll = true) {
  const errors = [];
  const pick = (val, fallback) =>
    val !== undefined && val !== null ? val : fallback;

  const name = pick(body.name, "").trim();
  const date_text = pick(body.date_text, "").trim();
  const ratingRaw = pick(body.rating, 5);
  const rating = Number.isFinite(Number(ratingRaw)) ? Number(ratingRaw) : 5;
  const quote = pick(body.quote, "").trim();
  const avatar = body.avatar ? String(body.avatar).trim() : null;
  const avatar_alt = body.avatar_alt ? String(body.avatar_alt).trim() : null;
  const is_featured =
    typeof body.is_featured === "boolean"
      ? body.is_featured
      : body.is_featured === "1" ||
        body.is_featured === 1 ||
        body.is_featured === "true";
  const sort_order = Number.isFinite(Number(body.sort_order))
    ? Number(body.sort_order)
    : 0;

  if (requireAll && !name) errors.push("name is required");
  if (requireAll && !quote) errors.push("quote is required");
  if (rating < 1 || rating > 5) errors.push("rating must be between 1 and 5");

  return {
    errors,
    data: {
      name,
      date_text: date_text || null,
      rating,
      quote,
      avatar: avatar || null,
      avatar_alt: avatar_alt || null,
      is_featured,
      sort_order,
    },
  };
}

function formatRow(row) {
  return {
    id: String(row.id),
    name: row.name,
    dateText: row.date_text,
    rating: row.rating,
    quote: row.quote,
    avatar: row.avatar,
    avatarAlt: row.avatar_alt,
    isFeatured: Boolean(row.is_featured),
    sortOrder: row.sort_order,
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const listTestimonials = async (req, res) => {
  try {
    const { published_only, featured_only, limit, offset, sort } = req.query;

    const where = [];
    const params = [];

    if (published_only === "true") {
      where.push("is_published = 1");
    }
    if (featured_only === "true") {
      where.push("is_featured = 1");
    }

    const orderSql =
      sort === "newest"
        ? "ORDER BY created_at DESC, sort_order ASC"
        : "ORDER BY sort_order ASC, id DESC";

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM testimonials ${whereSql}`,
      params
    );

    let rowsSql = `SELECT * FROM testimonials ${whereSql} ${orderSql}`;
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

    return sendSuccess(
      res,
      { items, totalCount: total },
      "Testimonials retrieved"
    );
  } catch (err) {
    console.error("listTestimonials error:", err);
    return sendError(res, "Failed to load testimonials.", 500);
  }
};

export const getTestimonial = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return sendError(res, "Invalid testimonial id.", 400);

    const [rows] = await db.query("SELECT * FROM testimonials WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0)
      return sendError(res, "Testimonial not found.", 404);

    return sendSuccess(res, formatRow(rows[0]), "Testimonial retrieved");
  } catch (err) {
    console.error("getTestimonial error:", err);
    return sendError(res, "Failed to load testimonial.", 500);
  }
};

export const createTestimonial = async (req, res) => {
  try {
    const { errors, data } = validateTestimonialPayload(req.body, true);
    if (errors.length > 0) {
      return sendError(res, errors.join(" "), 400);
    }

    const [result] = await db.query(
      `INSERT INTO testimonials
         (name, date_text, rating, quote, avatar, avatar_alt, is_featured, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        data.name,
        data.date_text,
        data.rating,
        data.quote,
        data.avatar,
        data.avatar_alt,
        data.is_featured ? 1 : 0,
        data.sort_order,
      ]
    );

    const [rows] = await db.query("SELECT * FROM testimonials WHERE id = ?", [
      result.insertId,
    ]);
    return sendSuccess(res, formatRow(rows[0]), "Testimonial created", 201);
  } catch (err) {
    console.error("createTestimonial error:", err);
    return sendError(res, "Failed to create testimonial.", 500);
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return sendError(res, "Invalid testimonial id.", 400);

    const [existingRows] = await db.query(
      "SELECT * FROM testimonials WHERE id = ?",
      [id]
    );
    if (existingRows.length === 0)
      return sendError(res, "Testimonial not found.", 404);

    const { errors, data } = validateTestimonialPayload(req.body, false);
    if (errors.length > 0) {
      return sendError(res, errors.join(" "), 400);
    }

    const sets = [];
    const params = [];
    const assignIf = (col, val) => {
      if (val !== undefined && val !== "" && val !== null) {
        sets.push(`\`${col}\` = ?`);
        params.push(val);
      }
    };
    const assignBool = (col, val) => {
      if (val !== undefined && val !== null) {
        sets.push(`\`${col}\` = ?`);
        params.push(val ? 1 : 0);
      }
    };

    assignIf("name", data.name || undefined);
    assignIf("date_text", data.date_text);
    if (data.rating !== undefined) {
      sets.push("`rating` = ?");
      params.push(data.rating);
    }
    assignIf("quote", data.quote || undefined);
    assignIf("avatar", data.avatar);
    assignIf("avatar_alt", data.avatar_alt);
    assignBool("is_featured", data.is_featured);
    if (data.sort_order !== undefined) {
      sets.push("`sort_order` = ?");
      params.push(data.sort_order);
    }
    sets.push("`updated_at` = CURRENT_TIMESTAMP");

    if (sets.length === 0) {
      return sendError(res, "No valid fields to update.", 400);
    }

    params.push(id);
    await db.query(
      `UPDATE testimonials SET ${sets.join(", ")} WHERE id = ?`,
      params
    );

    const [rows] = await db.query("SELECT * FROM testimonials WHERE id = ?", [
      id,
    ]);
    return sendSuccess(res, formatRow(rows[0]), "Testimonial updated");
  } catch (err) {
    console.error("updateTestimonial error:", err);
    return sendError(res, "Failed to update testimonial.", 500);
  }
};

export const toggleFeatured = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return sendError(res, "Invalid testimonial id.", 400);

    const [rows] = await db.query(
      "SELECT id, is_featured FROM testimonials WHERE id = ?",
      [id]
    );
    if (rows.length === 0)
      return sendError(res, "Testimonial not found.", 404);

    const nextState = rows[0].is_featured ? 0 : 1;
    await db.query(
      "UPDATE testimonials SET is_featured = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [nextState, id]
    );

    return sendSuccess(
      res,
      { id: String(id), isFeatured: Boolean(nextState) },
      nextState ? "Testimonial featured" : "Testimonial unfeatured"
    );
  } catch (err) {
    console.error("toggleFeatured error:", err);
    return sendError(res, "Failed to toggle featured state.", 500);
  }
};

export const togglePublish = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return sendError(res, "Invalid testimonial id.", 400);

    const [rows] = await db.query(
      "SELECT id, is_published FROM testimonials WHERE id = ?",
      [id]
    );
    if (rows.length === 0)
      return sendError(res, "Testimonial not found.", 404);

    const nextState = rows[0].is_published ? 0 : 1;
    await db.query(
      "UPDATE testimonials SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [nextState, id]
    );

    return sendSuccess(
      res,
      { id: String(id), isPublished: Boolean(nextState) },
      nextState ? "Testimonial published" : "Testimonial unpublished"
    );
  } catch (err) {
    console.error("togglePublish error:", err);
    return sendError(res, "Failed to toggle publish state.", 500);
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return sendError(res, "Invalid testimonial id.", 400);

    const [existing] = await db.query(
      "SELECT id FROM testimonials WHERE id = ?",
      [id]
    );
    if (existing.length === 0)
      return sendError(res, "Testimonial not found.", 404);

    await db.query("DELETE FROM testimonials WHERE id = ?", [id]);

    return sendSuccess(res, { id: String(id) }, "Testimonial deleted");
  } catch (err) {
    console.error("deleteTestimonial error:", err);
    return sendError(res, "Failed to delete testimonial.", 500);
  }
};
