import db from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";

function validateFaqPayload(body, requireAll = true) {
  const errors = [];
  const pick = (val, fallback) =>
    val !== undefined && val !== null ? val : fallback;

  const question = pick(body.question, "").trim();
  const answer = pick(body.answer, "").trim();
  const category = pick(body.category, "General").trim();
  const sort_order = Number.isFinite(Number(body.sort_order))
    ? Number(body.sort_order)
    : 0;
  const is_published =
    typeof body.is_published === "boolean"
      ? body.is_published
      : body.is_published === undefined
      ? true
      : body.is_published === "1" ||
        body.is_published === 1 ||
        body.is_published === "true";

  if (requireAll && !question) errors.push("question is required");
  if (requireAll && !answer) errors.push("answer is required");

  return {
    errors,
    data: {
      question,
      answer,
      category: category || "General",
      sort_order,
      is_published,
    },
  };
}

function formatRow(row) {
  return {
    id: String(row.id),
    question: row.question,
    answer: row.answer,
    category: row.category,
    sortOrder: row.sort_order,
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const listFaqs = async (req, res) => {
  try {
    const { published_only, category, limit, offset, sort } = req.query;

    const where = [];
    const params = [];

    if (published_only === "true") {
      where.push("is_published = 1");
    }
    if (category && category !== "All") {
      where.push("category = ?");
      params.push(category);
    }

    const orderSql =
      sort === "newest"
        ? "ORDER BY created_at DESC, sort_order ASC"
        : "ORDER BY sort_order ASC, id DESC";

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM faq_items ${whereSql}`,
      params
    );

    let rowsSql = `SELECT * FROM faq_items ${whereSql} ${orderSql}`;
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
      "FAQs retrieved"
    );
  } catch (err) {
    console.error("listFaqs error:", err);
    return sendError(res, "Failed to load FAQs.", 500);
  }
};

export const getFaq = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, "Invalid FAQ id.", 400);

    const [rows] = await db.query("SELECT * FROM faq_items WHERE id = ?", [
      id,
    ]);
    if (rows.length === 0) return sendError(res, "FAQ not found.", 404);

    return sendSuccess(res, formatRow(rows[0]), "FAQ retrieved");
  } catch (err) {
    console.error("getFaq error:", err);
    return sendError(res, "Failed to load FAQ.", 500);
  }
};

export const createFaq = async (req, res) => {
  try {
    const { errors, data } = validateFaqPayload(req.body, true);
    if (errors.length > 0) {
      return sendError(res, errors.join(" "), 400);
    }

    const [dupOrder] = await db.query(
      "SELECT id, question FROM faq_items WHERE sort_order = ? LIMIT 1",
      [data.sort_order]
    );
    if (dupOrder?.[0]) {
      return sendError(
        res,
        `Order number ${data.sort_order} is already in use by another FAQ. Please choose a unique order number.`,
        409
      );
    }

    const [result] = await db.query(
      `INSERT INTO faq_items
         (question, answer, category, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.question,
        data.answer,
        data.category,
        data.sort_order,
        data.is_published ? 1 : 0,
      ]
    );

    const [rows] = await db.query("SELECT * FROM faq_items WHERE id = ?", [
      result.insertId,
    ]);
    return sendSuccess(res, formatRow(rows[0]), "FAQ created", 201);
  } catch (err) {
    console.error("createFaq error:", err);
    return sendError(res, "Failed to create FAQ.", 500);
  }
};

export const updateFaq = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, "Invalid FAQ id.", 400);

    const [existingRows] = await db.query(
      "SELECT * FROM faq_items WHERE id = ?",
      [id]
    );
    if (existingRows.length === 0)
      return sendError(res, "FAQ not found.", 404);

    const { errors, data } = validateFaqPayload(req.body, false);
    if (errors.length > 0) {
      return sendError(res, errors.join(" "), 400);
    }

    if (data.sort_order !== undefined) {
      const [dupOrder] = await db.query(
        "SELECT id, question FROM faq_items WHERE sort_order = ? AND id <> ? LIMIT 1",
        [data.sort_order, id]
      );
      if (dupOrder?.[0]) {
        return sendError(
          res,
          `Order number ${data.sort_order} is already in use by another FAQ. Please choose a unique order number.`,
          409
        );
      }
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

    assignIf("question", data.question || undefined);
    assignIf("answer", data.answer || undefined);
    assignIf("category", data.category || undefined);
    if (data.sort_order !== undefined) {
      sets.push("`sort_order` = ?");
      params.push(data.sort_order);
    }
    assignBool("is_published", data.is_published);
    sets.push("`updated_at` = CURRENT_TIMESTAMP");

    if (sets.length === 0) {
      return sendError(res, "No valid fields to update.", 400);
    }

    params.push(id);
    await db.query(
      `UPDATE faq_items SET ${sets.join(", ")} WHERE id = ?`,
      params
    );

    const [rows] = await db.query("SELECT * FROM faq_items WHERE id = ?", [
      id,
    ]);
    return sendSuccess(res, formatRow(rows[0]), "FAQ updated");
  } catch (err) {
    console.error("updateFaq error:", err);
    return sendError(res, "Failed to update FAQ.", 500);
  }
};

export const togglePublish = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, "Invalid FAQ id.", 400);

    const [rows] = await db.query(
      "SELECT id, is_published FROM faq_items WHERE id = ?",
      [id]
    );
    if (rows.length === 0) return sendError(res, "FAQ not found.", 404);

    const nextState = rows[0].is_published ? 0 : 1;
    await db.query(
      "UPDATE faq_items SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [nextState, id]
    );

    return sendSuccess(
      res,
      { id: String(id), isPublished: Boolean(nextState) },
      nextState ? "FAQ published" : "FAQ unpublished"
    );
  } catch (err) {
    console.error("togglePublish error:", err);
    return sendError(res, "Failed to toggle publish state.", 500);
  }
};

export const deleteFaq = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, "Invalid FAQ id.", 400);

    const [existing] = await db.query(
      "SELECT id FROM faq_items WHERE id = ?",
      [id]
    );
    if (existing.length === 0) return sendError(res, "FAQ not found.", 404);

    await db.query("DELETE FROM faq_items WHERE id = ?", [id]);

    return sendSuccess(res, { id: String(id) }, "FAQ deleted");
  } catch (err) {
    console.error("deleteFaq error:", err);
    return sendError(res, "Failed to delete FAQ.", 500);
  }
};
