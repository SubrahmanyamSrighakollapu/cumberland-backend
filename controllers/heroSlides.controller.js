import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import db from "../config/database.js";
import { sendSuccess, sendError, asyncHandler } from "../utils/response.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.resolve(__dirname, "..", "uploads");

const MAX_LEN = {
  slug: 80,
  image: 255,
  alt: 255,
  eyebrow: 80,
  headingLine1: 100,
  headingLine2: 100,
  description: 500,
};

const SORT_OPTIONS = new Set([
  "sort_order_asc",
  "sort_order_desc",
  "newest",
  "oldest",
  "heading_asc",
]);

function stringToSlug(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LEN.slug) || "untitled";
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
    /* ignored */
  }
}

function formatRow(row) {
  if (!row) return row;
  return {
    id: String(row.id),
    slug: row.slug,
    image: row.image,
    alt: row.alt,
    eyebrow: row.eyebrow,
    headingLine1: row.heading_line_1,
    headingLine2: row.heading_line_2,
    description: row.description,
    sortOrder: Number(row.sort_order ?? 0),
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at ? row.created_at.toISOString?.() ?? String(row.created_at) : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString?.() ?? String(row.updated_at) : null,
  };
}

function validatePayload(body, requireAll = true) {
  const errors = [];
  const pick = (v, fb) => (v !== undefined && v !== null ? v : fb);

  const imageRaw = pick(body.image, "").trim();
  const alt = pick(body.alt, "").trim();
  const eyebrow = pick(body.eyebrow, "").trim();
  const headingLine1 = pick(body.headingLine1, pick(body.heading_line_1, "")).trim();
  const headingLine2 = pick(body.headingLine2, pick(body.heading_line_2, "")).trim();
  const description = pick(body.description, "").trim();
  const slugRaw = pick(body.slug, "").trim();

  const titleForSlug = headingLine1 || eyebrow;
  const slug = slugRaw
    ? stringToSlug(slugRaw)
    : titleForSlug
      ? stringToSlug(titleForSlug)
      : "hero-slide";

  const finalAlt = alt.length > 0 ? alt : (headingLine1 || headingLine2 || "Hero slide").slice(0, MAX_LEN.alt);
  const finalEyebrow = eyebrow.slice(0, MAX_LEN.eyebrow);

  if (requireAll || imageRaw.length > 0) {
    if (!imageRaw.length && requireAll) errors.push("Image is required.");
    if (imageRaw.length > MAX_LEN.image) errors.push(`Image URL too long (max ${MAX_LEN.image}).`);
  }
  if (finalAlt.length > MAX_LEN.alt) errors.push(`Alt text too long (max ${MAX_LEN.alt}).`);
  if (requireAll || headingLine1.length > 0) {
    if (!headingLine1.length && requireAll) errors.push("Heading line 1 is required.");
    if (headingLine1.length > MAX_LEN.headingLine1) errors.push(`Heading line 1 too long (max ${MAX_LEN.headingLine1}).`);
  }
  if (requireAll || headingLine2.length > 0) {
    if (!headingLine2.length && requireAll) errors.push("Heading line 2 is required.");
    if (headingLine2.length > MAX_LEN.headingLine2) errors.push(`Heading line 2 too long (max ${MAX_LEN.headingLine2}).`);
  }
  if (requireAll || description.length > 0) {
    if (!description.length && requireAll) errors.push("Description is required.");
    if (description.length > MAX_LEN.description) errors.push(`Description too long (max ${MAX_LEN.description}).`);
  }
  if (!slug.length && requireAll) errors.push("Slug is required.");
  if (slug.length > MAX_LEN.slug) errors.push(`Slug too long (max ${MAX_LEN.slug}).`);

  const sortOrder =
    body.sortOrder !== undefined && body.sortOrder !== null
      ? Number(body.sortOrder)
      : body.sort_order !== undefined && body.sort_order !== null
        ? Number(body.sort_order)
        : 0;
  const isPublishedRaw =
    body.isPublished !== undefined ? body.isPublished : body.is_published;
  const isPublished = requireAll
    ? isPublishedRaw === true || isPublishedRaw === "1" || isPublishedRaw === 1
    : isPublishedRaw === undefined
      ? null
      : isPublishedRaw === true || isPublishedRaw === "1" || isPublishedRaw === 1;

  return {
    errors,
    data: {
      image: imageRaw,
      alt: finalAlt,
      eyebrow: finalEyebrow,
      headingLine1,
      headingLine2,
      description,
      slug,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      isPublished,
    },
  };
}

/* ===================== LIST ===================== */
export const listHeroSlides = asyncHandler(async (req, res) => {
  const where = [];
  const params = [];

  const pub = req.query.published_only;
  if (pub === "true" || pub === "1") where.push("hs.is_published = 1");

  const q = req.query.q ? String(req.query.q).trim() : "";
  if (q.length > 0) {
    where.push(
      "(hs.slug LIKE ? OR hs.eyebrow LIKE ? OR hs.heading_line_1 LIKE ? OR hs.heading_line_2 LIKE ? OR hs.description LIKE ? OR hs.alt LIKE ?)"
    );
    const like = `%${q}%`;
    params.push(like, like, like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countSql = `SELECT COUNT(*) AS total FROM hero_slides hs ${whereSql}`;
  const [countRow] = await db.query(countSql, params);
  const total = Number(countRow?.[0]?.total ?? 0);

  let rawLimit = Number(req.query.limit ?? 50);
  let rawOffset = Number(req.query.offset ?? 0);
  if (!Number.isFinite(rawLimit) || rawLimit < 1) rawLimit = 50;
  if (!Number.isFinite(rawOffset) || rawOffset < 0) rawOffset = 0;
  const limit = Math.min(Math.floor(rawLimit), 200);
  const offset = Math.floor(rawOffset);

  const sortRaw = String(req.query.sort ?? "sort_order_asc").trim();
  const sort = SORT_OPTIONS.has(sortRaw) ? sortRaw : "sort_order_asc";
  const orderBy = {
    sort_order_asc: "hs.sort_order ASC, hs.id ASC",
    sort_order_desc: "hs.sort_order DESC, hs.id DESC",
    newest: "hs.created_at DESC, hs.id DESC",
    oldest: "hs.created_at ASC, hs.id ASC",
    heading_asc: "hs.heading_line_1 ASC, hs.sort_order ASC",
  }[sort];

  const rowsSql = `SELECT * FROM hero_slides hs ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`;
  const [rows] = await db.query(rowsSql, [...params, limit, offset]);

  return sendSuccess(res, {
    items: (rows || []).map(formatRow),
    total,
    limit,
    offset,
  });
});

/* ===================== GET BY ID/SLUG ===================== */
export const getHeroSlide = asyncHandler(async (req, res) => {
  const idOrSlug = String(req.params.id_or_slug ?? "").trim();
  let row = null;
  if (/^\d+$/.test(idOrSlug)) {
    const [r] = await db.query("SELECT * FROM hero_slides WHERE id = ? LIMIT 1", [
      Number(idOrSlug),
    ]);
    row = r?.[0] ?? null;
  }
  if (!row) {
    const [r] = await db.query("SELECT * FROM hero_slides WHERE slug = ? LIMIT 1", [idOrSlug]);
    row = r?.[0] ?? null;
  }
  if (!row) return sendError(res, "Hero slide not found.", 404);
  return sendSuccess(res, formatRow(row));
});

/* ===================== CREATE ===================== */
export const createHeroSlide = asyncHandler(async (req, res) => {
  if (req.file && req.file.filename) {
    req.body = req.body || {};
    req.body.image = `/uploads/${req.file.filename}`;
  }
  const { errors, data } = validatePayload(req.body, true);
  if (errors.length) {
    if (req.file?.filename) deleteUploadedFile(req.file.filename);
    return sendError(res, errors.join(" "), 400);
  }

  const [existing] = await db.query(
    "SELECT id FROM hero_slides WHERE slug = ? LIMIT 1",
    [data.slug]
  );
  if (existing?.[0]) {
    if (req.file?.filename) deleteUploadedFile(req.file.filename);
    return sendError(res, `A hero slide with slug "${data.slug}" already exists.`, 409);
  }

  const sql = `INSERT INTO hero_slides
    (slug, image, alt, eyebrow, heading_line_1, heading_line_2, description, sort_order, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const [inserted] = await db.query(sql, [
    data.slug,
    data.image,
    data.alt,
    data.eyebrow,
    data.headingLine1,
    data.headingLine2,
    data.description,
    data.sortOrder,
    data.isPublished ? 1 : 0,
  ]);
  const id = Number(inserted?.insertId || 0);
  const [r] = await db.query("SELECT * FROM hero_slides WHERE id = ? LIMIT 1", [id]);
  return sendSuccess(res, formatRow(r?.[0]), "Hero slide added.");
});

/* ===================== UPDATE ===================== */
export const updateHeroSlide = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, "Invalid hero slide id.", 400);

  const [currentRows] = await db.query("SELECT * FROM hero_slides WHERE id = ? LIMIT 1", [id]);
  const current = currentRows?.[0];
  if (!current) {
    if (req.file?.filename) deleteUploadedFile(req.file.filename);
    return sendError(res, "Hero slide not found.", 404);
  }

  if (req.file && req.file.filename) {
    req.body = req.body || {};
    req.body.image = `/uploads/${req.file.filename}`;
  }

  const { errors, data } = validatePayload(req.body, false);
  if (errors.length) {
    if (req.file?.filename) deleteUploadedFile(req.file.filename);
    return sendError(res, errors.join(" "), 400);
  }

  const slug = data.slug && data.slug.length > 0 ? data.slug : current.slug;
  if (data.slug && data.slug !== current.slug) {
    const [dup] = await db.query(
      "SELECT id FROM hero_slides WHERE slug = ? AND id <> ? LIMIT 1",
      [slug, id]
    );
    if (dup?.[0]) {
      if (req.file?.filename) deleteUploadedFile(req.file.filename);
      return sendError(res, `Another hero slide with slug "${slug}" already exists.`, 409);
    }
  }

  const nextImage = data.image && data.image.length > 0 ? data.image : current.image;
  const imageChanged = nextImage !== current.image;

  const next = {
    slug,
    image: nextImage,
    alt: data.alt || current.alt,
    eyebrow: data.eyebrow || current.eyebrow,
    heading_line_1: data.headingLine1 || current.heading_line_1,
    heading_line_2: data.headingLine2 || current.heading_line_2,
    description: data.description !== undefined && data.description.length > 0 ? data.description : current.description,
    sort_order: data.sortOrder !== undefined ? data.sortOrder : Number(current.sort_order ?? 0),
    is_published: data.isPublished !== null ? (data.isPublished ? 1 : 0) : Number(current.is_published ?? 1),
  };

  await db.query(
    `UPDATE hero_slides
     SET slug=?, image=?, alt=?, eyebrow=?, heading_line_1=?, heading_line_2=?, description=?, sort_order=?, is_published=?
     WHERE id = ?`,
    [
      next.slug,
      next.image,
      next.alt,
      next.eyebrow,
      next.heading_line_1,
      next.heading_line_2,
      next.description,
      next.sort_order,
      next.is_published,
      id,
    ]
  );

  if (imageChanged) {
    const oldRelative = extractLocalFile(current.image);
    if (oldRelative) deleteUploadedFile(oldRelative);
  }

  const [r] = await db.query("SELECT * FROM hero_slides WHERE id = ? LIMIT 1", [id]);
  return sendSuccess(res, formatRow(r?.[0]), "Hero slide updated.");
});

/* ===================== TOGGLE PUBLISH ===================== */
export const toggleHeroSlidePublish = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, "Invalid hero slide id.", 400);

  const [rows] = await db.query(
    "SELECT id, is_published FROM hero_slides WHERE id = ? LIMIT 1",
    [id]
  );
  if (!rows?.[0]) return sendError(res, "Hero slide not found.", 404);
  const next = rows[0].is_published ? 0 : 1;
  await db.query("UPDATE hero_slides SET is_published = ? WHERE id = ?", [next, id]);
  const [r] = await db.query(
    "SELECT id, slug, is_published, heading_line_1 FROM hero_slides WHERE id = ? LIMIT 1",
    [id]
  );
  const item = r?.[0];
  return sendSuccess(
    res,
    {
      id: String(item.id),
      slug: item.slug,
      isPublished: Boolean(item.is_published),
      headingLine1: item.heading_line_1,
    },
    Boolean(item.is_published) ? "Hero slide published." : "Hero slide unpublished."
  );
});

/* ===================== DELETE ===================== */
export const deleteHeroSlide = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, "Invalid hero slide id.", 400);

  const [rows] = await db.query("SELECT image FROM hero_slides WHERE id = ? LIMIT 1", [id]);
  const current = rows?.[0];
  if (!current) return sendError(res, "Hero slide not found.", 404);

  await db.query("DELETE FROM hero_slides WHERE id = ?", [id]);

  const rel = extractLocalFile(current.image);
  if (rel) deleteUploadedFile(rel);

  return sendSuccess(res, { id: String(id) }, "Hero slide deleted.");
});
