import db from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";

const HIGHLIGHTS_MAX = 12;

function stringToSlug(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function pick(val, fallback) {
  return val !== undefined && val !== null ? val : fallback;
}

function parseNumber(n, fallback) {
  if (n === undefined || n === null || n === "") return fallback;
  const num = Number(n);
  return Number.isFinite(num) ? num : fallback;
}

function parseBoolean(b, fallback = false) {
  if (typeof b === "boolean") return b;
  if (b === 1 || b === "1" || b === "true") return true;
  if (b === 0 || b === "0" || b === "false") return false;
  return fallback;
}

function parseJsonArray(raw, fallback = []) {
  if (!raw) return fallback;
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    if (typeof raw === "string") {
      return raw
        .split(/,|\n/)
        .map((x) => x.trim())
        .filter(Boolean);
    }
    return fallback;
  }
}

function parseFeatureTiles(raw, fallback = []) {
  if (!raw) return fallback;
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function parseStayInfo(raw, fallback = null) {
  if (!raw) return fallback;
  try {
    return JSON.parse(String(raw));
  } catch {
    return fallback;
  }
}

function validatePayload(body, requireAll = true) {
  const errors = [];

  const name = pick(body.name, "").trim();
  const slugRaw = pick(body.slug, "").trim();
  const slug = slugRaw ? stringToSlug(slugRaw) : name ? stringToSlug(name) : "";
  const eyebrow = pick(body.eyebrow, "ROOM COLLECTION").trim() || "ROOM COLLECTION";
  const shortDescription = pick(body.shortDescription, "").trim();
  const price = parseNumber(body.price, 0);
  const currency = pick(body.currency, "$").trim() || "$";
  const priceUnit = pick(body.priceUnit, "/ night").trim() || "/ night";
  const capacityGuests = parseNumber(body.capacityGuests, 2);
  const guestsLabel = pick(body.guestsLabel, `${capacityGuests} Guests`).trim() || `${capacityGuests} Guests`;
  const bedConfiguration = pick(body.bedConfiguration, "").trim();
  const areaM2 = parseNumber(body.areaM2, null);
  const areaLabel = body.areaLabel ? String(body.areaLabel).trim() : (areaM2 ? `${areaM2} m²` : null);
  const viewLabel = body.viewLabel ? String(body.viewLabel).trim() : null;
  const balconyLabel = body.balconyLabel ? String(body.balconyLabel).trim() : null;

  const seoTitle = body.seoTitle ? String(body.seoTitle).trim() : null;
  const seoDescription = body.seoDescription ? String(body.seoDescription).trim() : null;
  const introEyebrow = body.introEyebrow ? String(body.introEyebrow).trim() : null;
  const introHeading = body.introHeading ? String(body.introHeading).trim() : null;
  const introParagraph1 = body.introParagraph1 ? String(body.introParagraph1) : null;
  const introParagraph2 = body.introParagraph2 ? String(body.introParagraph2) : null;

  const featureTiles = parseFeatureTiles(body.featureTiles, []);
  const highlightJson = parseJsonArray(body.highlights, []).slice(0, HIGHLIGHTS_MAX);
  const stayInfoJson = parseStayInfo(body.stayInfoJson, null);

  const sortOrder = parseNumber(body.sortOrder, 0);
  const isFeatured = parseBoolean(body.isFeatured, false);
  const isPublished = parseBoolean(body.isPublished, true);

  if (requireAll && !name) errors.push("name is required");
  if (requireAll && !slug) errors.push("slug is required (or auto-derive from name)");
  if (requireAll && !shortDescription) errors.push("shortDescription is required");
  if (requireAll && !bedConfiguration) errors.push("bedConfiguration is required");
  if (price < 0) errors.push("price cannot be negative");
  if (capacityGuests < 0) errors.push("capacityGuests must be >= 0");

  return {
    errors,
    data: {
      slug,
      name,
      eyebrow,
      shortDescription,
      price,
      currency,
      priceUnit,
      capacityGuests,
      guestsLabel,
      bedConfiguration,
      areaM2,
      areaLabel,
      viewLabel,
      balconyLabel,
      seoTitle,
      seoDescription,
      introEyebrow,
      introHeading,
      introParagraph1,
      introParagraph2,
      featureTiles,
      highlightJson,
      stayInfoJson,
      sortOrder,
      isFeatured,
      isPublished,
    },
  };
}

function formatRow(row) {
  let highlights = [];
  if (row.highlight_json) {
    try { highlights = JSON.parse(row.highlight_json); } catch { highlights = []; }
    if (!Array.isArray(highlights)) highlights = [];
  }
  let featureTiles = [];
  if (row.intro_feature_tiles_json) {
    try { featureTiles = JSON.parse(row.intro_feature_tiles_json); } catch { featureTiles = []; }
    if (!Array.isArray(featureTiles)) featureTiles = [];
  }
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    eyebrow: row.eyebrow,
    shortDescription: row.short_description,
    price: Number(row.price),
    currency: row.currency,
    priceUnit: row.price_unit,
    capacityGuests: Number(row.capacity_guests),
    guestsLabel: row.guests_label,
    bedConfiguration: row.bed_configuration,
    areaM2: row.area_m2 ? Number(row.area_m2) : null,
    areaLabel: row.area_label,
    viewLabel: row.view_label,
    balconyLabel: row.balcony_label,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    intro: {
      eyebrow: row.intro_eyebrow,
      heading: row.intro_heading,
      paragraph1: row.intro_paragraph1,
      paragraph2: row.intro_paragraph2,
      featureTiles,
    },
    highlights,
    primaryImage: row.primary_image,
    gallery: row.gallery_json ? (() => {
      try {
        const p = JSON.parse(row.gallery_json);
        return Array.isArray(p) ? p : [];
      } catch { return []; }
    })() : [],
    relatedRoomIds: row.related_room_ids_json ? (() => {
      try {
        const p = JSON.parse(row.related_room_ids_json);
        return Array.isArray(p) ? p.map(String) : [];
      } catch { return []; }
    })() : [],
    isFeatured: Boolean(row.is_featured),
    sortOrder: Number(row.sort_order),
    isPublished: Boolean(row.is_published),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const listRooms = async (req, res) => {
  try {
    const { published_only, featured_only, limit, offset, sort, q } = req.query;
    const where = [];
    const params = [];
    if (published_only === "true") where.push("r.is_published = 1");
    if (featured_only === "true") where.push("r.is_featured = 1");
    if (q && String(q).trim()) {
      where.push("(r.name LIKE ? OR r.short_description LIKE ? OR r.slug LIKE ?)");
      const like = `%${String(q).trim()}%`;
      params.push(like, like, like);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const orderSql =
      sort === "price_asc"
        ? "ORDER BY r.price ASC, r.sort_order ASC"
        : sort === "price_desc"
        ? "ORDER BY r.price DESC, r.sort_order ASC"
        : sort === "newest"
        ? "ORDER BY r.created_at DESC"
        : "ORDER BY r.sort_order ASC, r.id ASC";

    const limitInt = Math.min(
      200,
      Math.max(1, parseNumber(limit, 50))
    );
    const offsetInt = Math.max(0, parseNumber(offset, 0));
    const [rows] = await db.query(
      `SELECT r.* FROM rooms r ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
      [...params, limitInt, offsetInt]
    );
    const [[{ total = 0 } = { total: 0 }]] = await db.query(
      `SELECT COUNT(*) AS total FROM rooms r ${whereSql}`,
      params
    );
    return sendSuccess(res, {
      items: rows.map(formatRow),
      total,
      limit: limitInt,
      offset: offsetInt,
    });
  } catch (err) {
    return sendError(res, err.message || "Failed to list rooms", 500);
  }
};

export const getRoom = async (req, res) => {
  try {
    const idOrSlug = req.params.id;
    const isNum = /^\d+$/.test(idOrSlug);
    const sql = isNum
      ? "SELECT * FROM rooms WHERE id = ? LIMIT 1"
      : "SELECT * FROM rooms WHERE slug = ? LIMIT 1";
    const [rows] = await db.query(sql, [idOrSlug]);
    if (!rows.length) return sendError(res, "Room not found", 404);
    return sendSuccess(res, formatRow(rows[0]));
  } catch (err) {
    return sendError(res, err.message || "Failed to fetch room", 500);
  }
};

export const createRoom = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { errors, data } = validatePayload(req.body, true);
    if (errors.length) return sendError(res, errors.join("; "), 400);

    const [exists] = await conn.query("SELECT id FROM rooms WHERE slug = ? LIMIT 1", [data.slug]);
    if (exists.length) return sendError(res, "slug already in use; pick a different name or slug", 400);

    const featureTilesJson =
      data.featureTiles && data.featureTiles.length ? JSON.stringify(data.featureTiles) : null;
    const highlightsJson =
      data.highlightJson && data.highlightJson.length ? JSON.stringify(data.highlightJson) : null;
    const stayInfoJson = data.stayInfoJson ? JSON.stringify(data.stayInfoJson) : null;

    const galleryRaw = parseJsonArray(req.body.gallery, []);
    const primaryImageRaw = req.body.primaryImage ? String(req.body.primaryImage).trim() : null;
    const galleryJson = galleryRaw.length ? JSON.stringify(galleryRaw) : null;
    const relatedRaw = parseJsonArray(req.body.relatedRoomIds, []).map(String);
    const relatedRoomIdsJson = relatedRaw.length ? JSON.stringify(relatedRaw) : null;

    const [result] = await conn.query(
      `INSERT INTO rooms (slug, name, eyebrow, short_description, price, currency, price_unit,
        capacity_guests, guests_label, bed_configuration, area_m2, area_label, view_label, balcony_label,
        seo_title, seo_description, intro_eyebrow, intro_heading, intro_paragraph1, intro_paragraph2,
        intro_feature_tiles_json, highlight_json, stay_info_json, primary_image, gallery_json,
        related_room_ids_json, sort_order, is_featured, is_published)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.slug,
        data.name,
        data.eyebrow,
        data.shortDescription,
        data.price,
        data.currency,
        data.priceUnit,
        data.capacityGuests,
        data.guestsLabel,
        data.bedConfiguration,
        data.areaM2,
        data.areaLabel,
        data.viewLabel,
        data.balconyLabel,
        data.seoTitle,
        data.seoDescription,
        data.introEyebrow,
        data.introHeading,
        data.introParagraph1,
        data.introParagraph2,
        featureTilesJson,
        highlightsJson,
        stayInfoJson,
        primaryImageRaw,
        galleryJson,
        relatedRoomIdsJson,
        data.sortOrder,
        data.isFeatured ? 1 : 0,
        data.isPublished ? 1 : 0,
      ]
    );
    const [rows] = await conn.query("SELECT * FROM rooms WHERE id = ? LIMIT 1", [result.insertId]);
    return sendSuccess(res, formatRow(rows[0]), "Room created successfully", 201);
  } catch (err) {
    return sendError(res, err.message || "Failed to create room", 500);
  } finally {
    conn.release();
  }
};

export const updateRoom = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, "Invalid room id", 400);

    const [existingRows] = await conn.query("SELECT * FROM rooms WHERE id = ? LIMIT 1", [id]);
    if (!existingRows.length) return sendError(res, "Room not found", 404);
    const existing = existingRows[0];

    const { errors, data } = validatePayload(req.body, false);
    if (errors.length) return sendError(res, errors.join("; "), 400);

    let slug = data.slug || existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      const [dup] = await conn.query("SELECT id FROM rooms WHERE slug = ? AND id <> ? LIMIT 1", [data.slug, id]);
      if (dup.length) return sendError(res, "slug already in use", 400);
      slug = data.slug;
    }

    const featureTilesJson =
      data.featureTiles && data.featureTiles.length
        ? JSON.stringify(data.featureTiles)
        : existing.intro_feature_tiles_json || null;
    const highlightsJson =
      data.highlightJson && data.highlightJson.length
        ? JSON.stringify(data.highlightJson)
        : existing.highlight_json || null;
    const stayInfoJson =
      data.stayInfoJson !== undefined
        ? data.stayInfoJson
          ? JSON.stringify(data.stayInfoJson)
          : null
        : existing.stay_info_json || null;

    const galleryRaw = req.body.gallery !== undefined ? parseJsonArray(req.body.gallery, []) : null;
    const galleryJson = galleryRaw
      ? galleryRaw.length
        ? JSON.stringify(galleryRaw)
        : null
      : existing.gallery_json || null;

    const primaryImageRaw =
      req.body.primaryImage !== undefined
        ? req.body.primaryImage
          ? String(req.body.primaryImage).trim()
          : null
        : existing.primary_image || null;

    const relatedRaw = req.body.relatedRoomIds !== undefined ? parseJsonArray(req.body.relatedRoomIds, []).map(String) : null;
    const relatedRoomIdsJson = relatedRaw
      ? relatedRaw.length
        ? JSON.stringify(relatedRaw)
        : null
      : existing.related_room_ids_json || null;

    await conn.query(
      `UPDATE rooms SET
         slug=?, name=?, eyebrow=?, short_description=?, price=?, currency=?, price_unit=?,
         capacity_guests=?, guests_label=?, bed_configuration=?, area_m2=?, area_label=?, view_label=?, balcony_label=?,
         seo_title=?, seo_description=?, intro_eyebrow=?, intro_heading=?, intro_paragraph1=?, intro_paragraph2=?,
         intro_feature_tiles_json=?, highlight_json=?, stay_info_json=?, primary_image=?, gallery_json=?,
         related_room_ids_json=?, sort_order=?, is_featured=?, is_published=?
       WHERE id=?`,
      [
        slug,
        data.name || existing.name,
        data.eyebrow || existing.eyebrow,
        data.shortDescription || existing.short_description,
        data.price,
        data.currency,
        data.priceUnit,
        data.capacityGuests,
        data.guestsLabel,
        data.bedConfiguration || existing.bed_configuration,
        data.areaM2 !== null ? data.areaM2 : existing.area_m2,
        data.areaLabel !== undefined ? data.areaLabel : existing.area_label,
        data.viewLabel !== undefined ? data.viewLabel : existing.view_label,
        data.balconyLabel !== undefined ? data.balconyLabel : existing.balcony_label,
        data.seoTitle !== undefined ? data.seoTitle : existing.seo_title,
        data.seoDescription !== undefined ? data.seoDescription : existing.seo_description,
        data.introEyebrow !== undefined ? data.introEyebrow : existing.intro_eyebrow,
        data.introHeading !== undefined ? data.introHeading : existing.intro_heading,
        data.introParagraph1 !== undefined ? data.introParagraph1 : existing.intro_paragraph1,
        data.introParagraph2 !== undefined ? data.introParagraph2 : existing.intro_paragraph2,
        featureTilesJson,
        highlightsJson,
        stayInfoJson,
        primaryImageRaw,
        galleryJson,
        relatedRoomIdsJson,
        data.sortOrder,
        data.isFeatured ? 1 : 0,
        data.isPublished ? 1 : 0,
        id,
      ]
    );
    const [rows] = await conn.query("SELECT * FROM rooms WHERE id = ? LIMIT 1", [id]);
    return sendSuccess(res, formatRow(rows[0]), "Room updated successfully");
  } catch (err) {
    return sendError(res, err.message || "Failed to update room", 500);
  } finally {
    conn.release();
  }
};

export const toggleFeatured = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, "Invalid room id", 400);
    const [rows] = await db.query("SELECT id, is_featured FROM rooms WHERE id = ? LIMIT 1", [id]);
    if (!rows.length) return sendError(res, "Room not found", 404);
    const newVal = rows[0].is_featured ? 0 : 1;
    await db.query("UPDATE rooms SET is_featured = ? WHERE id = ?", [newVal, id]);
    const [finalRows] = await db.query("SELECT * FROM rooms WHERE id = ? LIMIT 1", [id]);
    return sendSuccess(res, formatRow(finalRows[0]), newVal ? "Marked as featured" : "Removed from featured");
  } catch (err) {
    return sendError(res, err.message || "Failed to toggle featured", 500);
  }
};

export const togglePublish = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, "Invalid room id", 400);
    const [rows] = await db.query("SELECT id, is_published FROM rooms WHERE id = ? LIMIT 1", [id]);
    if (!rows.length) return sendError(res, "Room not found", 404);
    const newVal = rows[0].is_published ? 0 : 1;
    await db.query("UPDATE rooms SET is_published = ? WHERE id = ?", [newVal, id]);
    const [finalRows] = await db.query("SELECT * FROM rooms WHERE id = ? LIMIT 1", [id]);
    return sendSuccess(res, formatRow(finalRows[0]), newVal ? "Published" : "Unpublished");
  } catch (err) {
    return sendError(res, err.message || "Failed to toggle publish", 500);
  }
};

export const deleteRoom = async (req, res) => {
  const conn = await db.getConnection();
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, "Invalid room id", 400);
    const [rows] = await conn.query("SELECT id, name FROM rooms WHERE id = ? LIMIT 1", [id]);
    if (!rows.length) return sendError(res, "Room not found", 404);
    await conn.query("DELETE FROM rooms WHERE id = ?", [id]);
    return sendSuccess(res, { id: String(id), name: rows[0].name }, "Room deleted");
  } catch (err) {
    return sendError(res, err.message || "Failed to delete room", 500);
  } finally {
    conn.release();
  }
};
