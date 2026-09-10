import db from "../config/database.js";
import { sendSuccess, sendError, asyncHandler } from "../utils/response.js";

function pick(v, fallback) {
  if (v === undefined || v === null) return fallback;
  return v;
}
function parseNumber(v, fallback) {
  if (v === "" || v === undefined || v === null) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return n;
}
function parseBoolean(v, fallback) {
  if (v === true || v === 1 || v === "1" || v === "true") return true;
  if (v === false || v === 0 || v === "0" || v === "false") return false;
  return fallback;
}
function stringToSlug(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const HOME_ICON_KEYS = [
  "pool",
  "parking",
  "wifi",
  "ev",
  "kitchen",
  "bbq",
];
const ROOM_ICON_KEYS = [
  "wifi",
  "ac",
  "tv",
  "fridge",
  "coffee",
  "desk",
  "shower",
  "balcony",
  "parking",
  "non-smoking",
];
const ALL_ICON_KEYS = new Set([...HOME_ICON_KEYS, ...ROOM_ICON_KEYS]);
const CATEGORIES = new Set(["home", "room"]);

function formatRow(row) {
  return {
    id: String(row.id),
    slug: row.slug,
    category: row.category,
    title: row.title,
    description: row.description,
    iconKey: row.icon_key,
    sortOrder: Number(row.sort_order || 0),
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validatePayload(body, requireAll = true) {
  const errors = [];
  const category = pick(body.category, "home").trim().toLowerCase();
  if (!CATEGORIES.has(category)) {
    errors.push("category must be one of: home, room");
  }
  const title = pick(body.title, "").trim();
  const slugRaw = pick(body.slug, "").trim();
  const slug = slugRaw ? stringToSlug(slugRaw) : title ? stringToSlug(title) : "";
  const description = body.description ? String(body.description).trim() : null;
  const iconKey = pick(body.iconKey, "").trim();
  const sortOrder = parseNumber(body.sortOrder, 0);
  const isPublished = parseBoolean(body.isPublished, true);

  if (requireAll && !title) errors.push("title is required");
  if (requireAll && !slug) errors.push("slug is required (or auto-derive from title)");
  if (requireAll && !iconKey) errors.push("iconKey is required");
  if (iconKey && !ALL_ICON_KEYS.has(iconKey)) {
    errors.push(
      `iconKey "${iconKey}" not supported — allowed: ${[...ALL_ICON_KEYS].join(", ")}`
    );
  }
  if (description && description.length > 255)
    errors.push("description max length is 255 characters");
  if (title && title.length > 100) errors.push("title max length is 100 characters");

  return {
    errors,
    data: { category, title, slug, description, iconKey, sortOrder, isPublished },
  };
}

export const listAmenities = asyncHandler(async (req, res) => {
  const category = req.query.category ? String(req.query.category).trim().toLowerCase() : null;
  const publishedOnly = parseBoolean(req.query.published_only, null);
  const limit = Math.min(200, parseNumber(req.query.limit, 200));
  const offset = parseNumber(req.query.offset, 0);
  const q = req.query.q ? String(req.query.q).trim().toLowerCase() : "";
  const sort = req.query.sort ? String(req.query.sort).trim() : "sort_order_asc";

  const where = [];
  const params = [];
  if (category && CATEGORIES.has(category)) {
    where.push("category = ?");
    params.push(category);
  }
  if (publishedOnly === true) {
    where.push("is_published = 1");
  } else if (publishedOnly === false) {
    where.push("is_published = 0");
  }
  if (q) {
    where.push("(LOWER(title) LIKE ? OR LOWER(slug) LIKE ? OR LOWER(COALESCE(description,'')) LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sortMap = {
    sort_order_asc: "sort_order ASC, title ASC",
    sort_order_desc: "sort_order DESC, title ASC",
    title_asc: "title ASC",
    newest: "created_at DESC",
    oldest: "created_at ASC",
  };
  const orderBy = sortMap[sort] || sortMap.sort_order_asc;

  const countSql = `SELECT COUNT(*) AS total FROM amenities ${whereSql}`;
  const [countRow] = await db.query(countSql, params);
  const total = Number(countRow?.[0]?.total ?? 0);

  const rowsSql = `SELECT * FROM amenities ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  const [rows] = await db.query(rowsSql, [...params, limit, offset]);

  return sendSuccess(res, {
    items: (rows || []).map(formatRow),
    total,
    limit,
    offset,
  });
});

export const getAmenity = asyncHandler(async (req, res) => {
  const idOrSlug = String(req.params.id_or_slug || "");
  let row = null;
  if (/^\d+$/.test(idOrSlug)) {
    const [r] = await db.query("SELECT * FROM amenities WHERE id = ? LIMIT 1", [
      Number(idOrSlug),
    ]);
    row = r?.[0] ?? null;
  }
  if (!row) {
    const category = req.query.category
      ? String(req.query.category).trim().toLowerCase()
      : null;
    const params = [idOrSlug];
    let sql = "SELECT * FROM amenities WHERE slug = ?";
    if (category && CATEGORIES.has(category)) {
      sql += " AND category = ?";
      params.push(category);
    }
    sql += " LIMIT 1";
    const [r] = await db.query(sql, params);
    row = r?.[0] ?? null;
  }
  if (!row) return sendError(res, "Amenity not found.", 404);
  return sendSuccess(res, formatRow(row));
});

export const createAmenity = asyncHandler(async (req, res) => {
  const { errors, data } = validatePayload(req.body, true);
  if (errors.length) return sendError(res, errors.join(" "), 400);

  const [existing] = await db.query(
    "SELECT id FROM amenities WHERE slug = ? AND category = ? LIMIT 1",
    [data.slug, data.category]
  );
  if (existing?.[0])
    return sendError(
      res,
      `An amenity with slug "${data.slug}" already exists in category ${data.category}.`,
      409
    );

  const insertSql = `INSERT INTO amenities
    (category, slug, title, description, icon_key, sort_order, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const [inserted] = await db.query(insertSql, [
    data.category,
    data.slug,
    data.title,
    data.description,
    data.iconKey,
    data.sortOrder,
    data.isPublished ? 1 : 0,
  ]);
  const id = Number(inserted?.insertId || 0);
  const [r] = await db.query("SELECT * FROM amenities WHERE id = ? LIMIT 1", [id]);
  return sendSuccess(
    res,
    formatRow(r?.[0]),
    `${data.category === "home" ? "Home" : "Room"} amenity added.`
  );
});

export const updateAmenity = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0)
    return sendError(res, "Invalid amenity id.", 400);

  const [currentRows] = await db.query(
    "SELECT * FROM amenities WHERE id = ? LIMIT 1",
    [id]
  );
  const current = currentRows?.[0];
  if (!current) return sendError(res, "Amenity not found.", 404);

  const { errors, data } = validatePayload(req.body, false);
  if (errors.length) return sendError(res, errors.join(" "), 400);

  const category = data.category || current.category;
  const slug = data.slug || current.slug;
  if (data.slug && data.slug !== current.slug) {
    const [dup] = await db.query(
      "SELECT id FROM amenities WHERE slug = ? AND category = ? AND id <> ? LIMIT 1",
      [slug, category, id]
    );
    if (dup?.[0])
      return sendError(
        res,
        `Another amenity with slug "${slug}" already exists in category ${category}.`,
        409
      );
  }

  const next = {
    category: category,
    slug: slug,
    title: data.title || current.title,
    description:
      data.description !== undefined ? data.description : current.description,
    icon_key: data.iconKey || current.icon_key,
    sort_order: data.sortOrder !== undefined ? data.sortOrder : current.sort_order,
    is_published: data.isPublished !== undefined ? (data.isPublished ? 1 : 0) : current.is_published,
  };

  await db.query(
    `UPDATE amenities
     SET category=?, slug=?, title=?, description=?, icon_key=?, sort_order=?, is_published=?
     WHERE id = ?`,
    [
      next.category,
      next.slug,
      next.title,
      next.description,
      next.icon_key,
      next.sort_order,
      next.is_published,
      id,
    ]
  );
  const [r] = await db.query("SELECT * FROM amenities WHERE id = ? LIMIT 1", [id]);
  return sendSuccess(res, formatRow(r?.[0]), "Amenity updated.");
});

export const toggleAmenityPublish = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0)
    return sendError(res, "Invalid amenity id.", 400);
  const [rows] = await db.query(
    "SELECT id, is_published FROM amenities WHERE id = ? LIMIT 1",
    [id]
  );
  if (!rows?.[0]) return sendError(res, "Amenity not found.", 404);
  const next = rows[0].is_published ? 0 : 1;
  await db.query("UPDATE amenities SET is_published = ? WHERE id = ?", [
    next,
    id,
  ]);
  const [r] = await db.query(
    "SELECT id, is_published, category, slug, title FROM amenities WHERE id = ? LIMIT 1",
    [id]
  );
  const item = r?.[0];
  return sendSuccess(res, {
    id: String(item.id),
    isPublished: Boolean(item.is_published),
    category: item.category,
    slug: item.slug,
    title: item.title,
  }, next ? "Amenity published." : "Amenity unpublished.");
});

export const deleteAmenity = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0)
    return sendError(res, "Invalid amenity id.", 400);
  const [rows] = await db.query("SELECT id FROM amenities WHERE id = ? LIMIT 1", [
    id,
  ]);
  if (!rows?.[0]) return sendError(res, "Amenity not found.", 404);
  await db.query("DELETE FROM amenities WHERE id = ?", [id]);
  return sendSuccess(res, { id: String(id) }, "Amenity deleted.");
});
