import "dotenv/config";
import db from "../config/database.js";

const HERO_SLIDES = [
  {
    slug: "hero-waterfront-retreat",
    image: "/images/hero-one.png",
    alt: "Coastal motel pool overlooking the water at sunset",
    eyebrow: "Boutique Waterfront Retreat",
    heading_line_1: "Make room for",
    heading_line_2: "the good days.",
    description:
      "Boutique coastal stays, warmer days and unforgettable moments by the water.",
    sort_order: 1,
    is_published: 1,
  },
  {
    slug: "hero-coastal-poolside-escape",
    image: "/images/hero-two.png",
    alt: "Cumberland Motor Inn balcony and landscaped courtyard",
    eyebrow: "Coastal Poolside Escape",
    heading_line_1: "Make room for",
    heading_line_2: "the good days.",
    description:
      "Boutique coastal stays, warmer days and unforgettable moments by the water.",
    sort_order: 2,
    is_published: 1,
  },
  {
    slug: "hero-golden-hour-waterfront",
    image: "/images/hero-three.png",
    alt: "Waterfront motel terrace and pool during golden hour",
    eyebrow: "Golden Hour Waterfront Views",
    heading_line_1: "Make room for",
    heading_line_2: "the good days.",
    description:
      "Boutique coastal stays, warmer days and unforgettable moments by the water.",
    sort_order: 3,
    is_published: 1,
  },
];

const COLS = [
  "slug",
  "image",
  "alt",
  "eyebrow",
  "heading_line_1",
  "heading_line_2",
  "description",
  "sort_order",
  "is_published",
];

const placeholders = COLS.map(() => "?").join(", ");
const updateClause = COLS.map(
  (col) => `${col} = VALUES(${col})`
).join(", ");

async function seed() {
  console.log("🌊 Seeding hero slides...");
  let ok = 0;
  for (const s of HERO_SLIDES) {
    const sql = `INSERT INTO hero_slides (${COLS.join(", ")})
       VALUES (${placeholders})
       ON DUPLICATE KEY UPDATE ${updateClause}`;
    try {
      const values = COLS.map((c) => s[c]);
      const [result] = await db.query(sql, values);
      const status = result.affectedRows === 2 ? "UPDATED" : "INSERTED";
      console.log(`  ✅ [${status}] ${s.slug}`);
      ok++;
    } catch (e) {
      console.error(`  ❌ FAIL ${s.slug}:`, e.message);
    }
  }
  console.log(`\n🌊 Hero slides: ${ok}/${HERO_SLIDES.length} done.\n`);
  await db.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
