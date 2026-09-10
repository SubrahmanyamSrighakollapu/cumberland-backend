import "dotenv/config";
import db from "../config/database.js";

const HOME_AMENITIES = [
  {
    slug: "pool",
    category: "home",
    title: "Heated Pool",
    description: "Swim year-round with ocean views.",
    icon_key: "pool",
    sort_order: 1,
    is_published: 1,
  },
  {
    slug: "parking",
    category: "home",
    title: "Free Parking",
    description: "On-site and hassle-free.",
    icon_key: "parking",
    sort_order: 2,
    is_published: 1,
  },
  {
    slug: "wifi",
    category: "home",
    title: "Complimentary Wi-Fi",
    description: "Stay connected throughout your stay.",
    icon_key: "wifi",
    sort_order: 3,
    is_published: 1,
  },
  {
    slug: "ev",
    category: "home",
    title: "EV Charging",
    description: "Charge up and explore further.",
    icon_key: "ev",
    sort_order: 4,
    is_published: 1,
  },
  {
    slug: "kitchen",
    category: "home",
    title: "Kitchenette Rooms",
    description: "Make it your own with in-room kitchenettes.",
    icon_key: "kitchen",
    sort_order: 5,
    is_published: 1,
  },
  {
    slug: "bbq",
    category: "home",
    title: "BBQ & Outdoor Area",
    description: "Good food tastes better by the water.",
    icon_key: "bbq",
    sort_order: 6,
    is_published: 1,
  },
];

const ROOM_AMENITIES = [
  {
    slug: "wifi",
    category: "room",
    title: "Complimentary Wi-Fi",
    description: "High-speed wireless internet throughout the room.",
    icon_key: "wifi",
    sort_order: 1,
    is_published: 1,
  },
  {
    slug: "ac",
    category: "room",
    title: "Air conditioning",
    description: "Climate control heating and cooling.",
    icon_key: "ac",
    sort_order: 2,
    is_published: 1,
  },
  {
    slug: "tv",
    category: "room",
    title: "Smart TV with casting",
    description: "50-inch HD Smart TV with streaming capabilities.",
    icon_key: "tv",
    sort_order: 3,
    is_published: 1,
  },
  {
    slug: "fridge",
    category: "room",
    title: "Mini refrigerator",
    description: "Compact in-room fridge for refreshments.",
    icon_key: "fridge",
    sort_order: 4,
    is_published: 1,
  },
  {
    slug: "coffee",
    category: "room",
    title: "Tea & coffee facilities",
    description: "Nespresso machine with complimentary pods and tea.",
    icon_key: "coffee",
    sort_order: 5,
    is_published: 1,
  },
  {
    slug: "desk",
    category: "room",
    title: "Work desk",
    description: "Dedicated workspace with ergonomic seating.",
    icon_key: "desk",
    sort_order: 6,
    is_published: 1,
  },
  {
    slug: "shower",
    category: "room",
    title: "Rain shower",
    description: "Modern ensuite bathroom with rain shower.",
    icon_key: "shower",
    sort_order: 7,
    is_published: 1,
  },
  {
    slug: "balcony",
    category: "room",
    title: "Private balcony or patio",
    description: "Fresh coastal air, right outside your door.",
    icon_key: "balcony",
    sort_order: 8,
    is_published: 1,
  },
  {
    slug: "parking",
    category: "room",
    title: "Free on-site parking",
    description: "Reserved spot included with every booking.",
    icon_key: "parking",
    sort_order: 9,
    is_published: 1,
  },
  {
    slug: "non-smoking",
    category: "room",
    title: "Non-smoking rooms",
    description: "100% non-smoking throughout the property.",
    icon_key: "non-smoking",
    sort_order: 10,
    is_published: 1,
  },
];

const ALL = [...HOME_AMENITIES, ...ROOM_AMENITIES];

const COLS = [
  "slug",
  "category",
  "title",
  "description",
  "icon_key",
  "sort_order",
  "is_published",
];

function colEscaped(col) {
  return `\`${col}\``;
}

async function upsertAll() {
  const placeholders = COLS.map(() => "?").join(", ");
  const updateSet = COLS.filter(
    (c) => !["slug", "category"].includes(c)
  )
    .map((c) => `${colEscaped(c)} = VALUES(${colEscaped(c)})`)
    .join(", ");
  const sql = `INSERT INTO amenities (${COLS.map(colEscaped).join(", ")})
               VALUES (${placeholders})
               ON DUPLICATE KEY UPDATE ${updateSet}`;

  for (const row of ALL) {
    const values = COLS.map((c) => row[c]);
    await db.query(sql, values);
    console.log(
      `[seed:amenities] UPSERT  ${row.category.padEnd(4)} / ${row.slug.padEnd(12)} -> ${row.title}`
    );
  }
  console.log(
    `[seed:amenities] Done — ${ALL.length} rows (${HOME_AMENITIES.length} home + ${ROOM_AMENITIES.length} room).`
  );
}

upsertAll()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed:amenities] FAIL:", err);
    process.exit(1);
  });
