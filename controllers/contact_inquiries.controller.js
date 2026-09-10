import db from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";

const VALID_STATUSES = ["new", "read", "replied", "archived"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateInquiryPayload(body) {
  const errors = [];
  const pick = (val, fallback) =>
    val !== undefined && val !== null ? val : fallback;

  const full_name = pick(body.full_name, "").trim();
  const email = pick(body.email, "").trim();
  const phone = body.phone ? String(body.phone).trim() : null;
  const enquiry_type = body.enquiry_type
    ? String(body.enquiry_type).trim()
    : null;
  const subject = body.subject ? String(body.subject).trim() : null;
  const message = pick(body.message, "").trim();
  const arrival_date = body.arrival_date
    ? String(body.arrival_date).trim()
    : null;
  const departure_date = body.departure_date
    ? String(body.departure_date).trim()
    : null;

  const final_subject = subject || enquiry_type || null;

  if (!full_name) errors.push("full_name is required");
  if (!email) errors.push("email is required");
  else if (!EMAIL_REGEX.test(email)) errors.push("email must be a valid address");
  if (!message) errors.push("message is required");

  const extraObj = {};
  if (enquiry_type) extraObj.enquiry_type = enquiry_type;
  if (arrival_date) extraObj.arrival_date = arrival_date;
  if (departure_date) extraObj.departure_date = departure_date;
  const extra_json =
    Object.keys(extraObj).length > 0 ? JSON.stringify(extraObj) : null;

  return {
    errors,
    data: {
      full_name,
      email,
      phone: phone || null,
      subject: final_subject,
      message,
      extra_json,
    },
  };
}

function formatRow(row) {
  let extra = null;
  if (row.extra_json) {
    try {
      extra = JSON.parse(row.extra_json);
    } catch (_) {
      extra = null;
    }
  }
  const ex = extra && typeof extra === "object" ? extra : {};
  return {
    id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    enquiryType: ex.enquiry_type ?? null,
    arrivalDate: ex.arrival_date ?? null,
    departureDate: ex.departure_date ?? null,
    message: row.message,
    status: row.status,
    isSpam: Boolean(row.is_spam),
    replySent: Boolean(row.reply_sent),
    extra,
    createdAt: row.created_at ? (typeof row.created_at.toISOString === "function" ? row.created_at.toISOString() : String(row.created_at)) : null,
    updatedAt: row.updated_at ? (typeof row.updated_at.toISOString === "function" ? row.updated_at.toISOString() : String(row.updated_at)) : null,
  };
}

export const listInquiries = async (req, res) => {
  try {
    const { status, q, limit, offset, sort } = req.query;

    const where = [];
    const params = [];

    if (status && VALID_STATUSES.includes(status)) {
      where.push("status = ?");
      params.push(status);
    }
    if (q && String(q).trim().length > 0) {
      const search = `%${String(q).trim()}%`;
      where.push("(full_name LIKE ? OR email LIKE ? OR subject LIKE ?)");
      params.push(search, search, search);
    }

    const orderSql =
      sort === "oldest"
        ? "ORDER BY id ASC"
        : "ORDER BY id DESC";

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM contact_inquiries ${whereSql}`,
      params
    );

    let rowsSql = `SELECT * FROM contact_inquiries ${whereSql} ${orderSql}`;
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
      "Contact inquiries retrieved"
    );
  } catch (err) {
    console.error("listInquiries error:", err);
    return sendError(res, "Failed to load contact inquiries.", 500);
  }
};

export const getInquiry = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return sendError(res, "Invalid inquiry id.", 400);

    const [rows] = await db.query(
      "SELECT * FROM contact_inquiries WHERE id = ?",
      [id]
    );
    if (rows.length === 0)
      return sendError(res, "Contact inquiry not found.", 404);

    await db.query(
      "UPDATE contact_inquiries SET status = 'read', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'new'",
      [id]
    );

    const [updatedRows] = await db.query(
      "SELECT * FROM contact_inquiries WHERE id = ?",
      [id]
    );

    return sendSuccess(
      res,
      formatRow(updatedRows[0]),
      "Contact inquiry retrieved"
    );
  } catch (err) {
    console.error("getInquiry error:", err);
    return sendError(res, "Failed to load contact inquiry.", 500);
  }
};

export const createInquiry = async (req, res) => {
  try {
    const { errors, data } = validateInquiryPayload(req.body);
    if (errors.length > 0) {
      return sendError(res, errors.join(" "), 400);
    }

    const [result] = await db.query(
      `INSERT INTO contact_inquiries
         (full_name, email, phone, subject, message, extra_json, status, is_spam, reply_sent)
       VALUES (?, ?, ?, ?, ?, ?, 'new', 0, 0)`,
      [
        data.full_name,
        data.email,
        data.phone,
        data.subject,
        data.message,
        data.extra_json,
      ]
    );

    const [rows] = await db.query(
      "SELECT * FROM contact_inquiries WHERE id = ?",
      [result.insertId]
    );
    return sendSuccess(
      res,
      { id: String(result.insertId), ...formatRow(rows[0]) },
      "Thank you — your message has been sent. We'll be in touch soon.",
      201
    );
  } catch (err) {
    console.error("createInquiry error:", err);
    return sendError(res, "Failed to send your message. Please try again.", 500);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return sendError(res, "Invalid inquiry id.", 400);

    const [existingRows] = await db.query(
      "SELECT * FROM contact_inquiries WHERE id = ?",
      [id]
    );
    if (existingRows.length === 0)
      return sendError(res, "Contact inquiry not found.", 404);

    const body = req.body || {};
    const sets = [];
    const params = [];

    if (body.status !== undefined && body.status !== null) {
      const next = String(body.status).toLowerCase();
      if (!VALID_STATUSES.includes(next)) {
        return sendError(
          res,
          `status must be one of: ${VALID_STATUSES.join(", ")}`,
          400
        );
      }
      sets.push("`status` = ?");
      params.push(next);
    }

    if (body.reply_sent !== undefined && body.reply_sent !== null) {
      const reply_sent =
        typeof body.reply_sent === "boolean"
          ? body.reply_sent
          : body.reply_sent === "1" ||
            body.reply_sent === 1 ||
            body.reply_sent === "true";
      sets.push("`reply_sent` = ?");
      params.push(reply_sent ? 1 : 0);
    }

    if (body.is_spam !== undefined && body.is_spam !== null) {
      const is_spam =
        typeof body.is_spam === "boolean"
          ? body.is_spam
          : body.is_spam === "1" ||
            body.is_spam === 1 ||
            body.is_spam === "true";
      sets.push("`is_spam` = ?");
      params.push(is_spam ? 1 : 0);
    }

    if (sets.length === 0) {
      return sendError(res, "No valid fields to update.", 400);
    }

    sets.push("`updated_at` = CURRENT_TIMESTAMP");
    params.push(id);

    await db.query(
      `UPDATE contact_inquiries SET ${sets.join(", ")} WHERE id = ?`,
      params
    );

    const [rows] = await db.query(
      "SELECT * FROM contact_inquiries WHERE id = ?",
      [id]
    );
    return sendSuccess(
      res,
      formatRow(rows[0]),
      "Contact inquiry updated"
    );
  } catch (err) {
    console.error("updateStatus error:", err);
    return sendError(res, "Failed to update contact inquiry.", 500);
  }
};

export const deleteInquiry = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return sendError(res, "Invalid inquiry id.", 400);

    const [existing] = await db.query(
      "SELECT id FROM contact_inquiries WHERE id = ?",
      [id]
    );
    if (existing.length === 0)
      return sendError(res, "Contact inquiry not found.", 404);

    await db.query("DELETE FROM contact_inquiries WHERE id = ?", [id]);

    return sendSuccess(res, { id: String(id) }, "Contact inquiry deleted");
  } catch (err) {
    console.error("deleteInquiry error:", err);
    return sendError(res, "Failed to delete contact inquiry.", 500);
  }
};
