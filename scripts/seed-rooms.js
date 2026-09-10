import "dotenv/config";
import db from "../config/database.js";

const ROOMS = [
  {
    slug: "lakeview-queen-balcony",
    name: "Lakeview Queen Balcony",
    eyebrow: "ROOM COLLECTION",
    short_description:
      "Quiet comfort, private balcony, and a view worth waking up for.",
    price: 210,
    currency: "$",
    price_unit: "/ night",
    capacity_guests: 2,
    guests_label: "2 Guests",
    bed_configuration: "1 Queen Bed",
    area_m2: 32,
    area_label: "32 m²",
    view_label: "Lake View",
    balcony_label: "Private Balcony",
    seo_title: "Lakeview Queen Balcony | Cumberland Motor Inn",
    seo_description:
      "Enjoy quiet coastal comfort, a private balcony, and serene lake views at Cumberland Motor Inn.",
    intro_eyebrow: "THE LAKEVIEW EXPERIENCE",
    intro_heading: "Room to slow down.",
    intro_paragraph1:
      "Our Lakeview Queen Balcony room offers the perfect blend of comfort and coastal charm. Relax on your private balcony with peaceful water views, enjoy modern amenities, and unwind in a spacious, beautifully appointed space.",
    intro_paragraph2:
      "Whether you're here for a weekend escape or a longer stay, this room is designed to help you slow down and make the most of the stunning surroundings.",
    intro_feature_tiles_json: JSON.stringify([
      { id: "ft-1", icon: "person", label: "2 Guests" },
      { id: "ft-2", icon: "bed", label: "1 Queen Bed" },
      { id: "ft-3", icon: "area", label: "32 m²" },
      { id: "ft-4", icon: "balcony", label: "Private Balcony" },
    ]),
    stay_info_json: null,
    highlight_json: JSON.stringify([
      "Fully renovated with modern coastal styling",
      "Private balcony with beautiful lake views",
      "Luxurious queen bed with premium linen",
      "Spacious and comfortable for couples",
    ]),
    primary_image: "/images/room-one.png",
    gallery_json: JSON.stringify([
      { id: "gal-1", src: "/images/room-one.png", alt: "Lakeview Queen Balcony room interior with plush queen bed and view", caption: "Spacious and comfortable" },
      { id: "gal-2", src: "/images/room-two.png", alt: "Private balcony with outdoor chairs overlooking the water", caption: "Private balcony with lake views" },
      { id: "gal-3", src: "/images/room-three.png", alt: "Modern renovated bathroom with walk-in rainfall shower", caption: "Renovated ensuite bathroom" },
      { id: "gal-4", src: "/images/room-four.png", alt: "In-room coffee station with Nespresso machine", caption: "Nespresso tea and coffee facilities" },
      { id: "gal-5", src: "/images/room-five.png", alt: "Seating area with comfortable armchairs near balcony window", caption: "Relaxing indoor lounge corner" },
      { id: "gal-6", src: "/images/room-six.png", alt: "Bedroom vanity desk and ambient lighting", caption: "Work desk & Smart TV area" },
      { id: "gal-7", src: "/images/room-seven.png", alt: "Close-up of premium linen and soft pillows", caption: "Luxury linens and bedding" },
      { id: "gal-8", src: "/images/room-eight.png", alt: "Sunset view from room balcony", caption: "Golden hour balcony vista" },
    ]),
    related_room_ids_json: JSON.stringify([
      "garden-king",
      "twin-courtyard",
      "family-suite",
    ]),
    sort_order: 1,
    is_featured: 0,
    is_published: 1,
  },
  {
    slug: "garden-king",
    name: "Garden King",
    eyebrow: "ROOM COLLECTION",
    short_description:
      "Spacious comfort with garden views and a private patio.",
    price: 200,
    currency: "$",
    price_unit: "/ night",
    capacity_guests: 2,
    guests_label: "2 Guests",
    bed_configuration: "1 King Bed",
    area_m2: 35,
    area_label: "35 m²",
    view_label: "Garden View",
    balcony_label: "Private Patio",
    seo_title: "Garden King | Cumberland Motor Inn",
    seo_description:
      "Relax in our Garden King room featuring a private patio, lush garden surroundings, and a king bed.",
    intro_eyebrow: "LUSH GARDEN SETTING",
    intro_heading: "Peaceful garden retreat.",
    intro_paragraph1:
      "Surrounded by manicured coastal gardens, our Garden King room offers a tranquil setting with an outdoor patio area. Perfect for morning coffees or unhurried reading.",
    intro_paragraph2:
      "Featuring a plush king-sized bed, premium amenities, and walk-in shower for a truly restful getaway.",
    intro_feature_tiles_json: JSON.stringify([
      { id: "ft-1", icon: "person", label: "2 Guests" },
      { id: "ft-2", icon: "bed", label: "1 King Bed" },
      { id: "ft-3", icon: "area", label: "35 m²" },
      { id: "ft-4", icon: "patio", label: "Private Patio" },
    ]),
    stay_info_json: null,
    highlight_json: JSON.stringify([
      "Spacious layout with king bed",
      "Private outdoor garden patio",
      "Quiet ground-floor access",
      "Full modern amenities included",
    ]),
    primary_image: "/images/room-two.png",
    gallery_json: JSON.stringify([
      { id: "gal-1", src: "/images/room-two.png", alt: "Garden King bedroom with king bed", caption: "Spacious king bedroom" },
      { id: "gal-2", src: "/images/room-seven.png", alt: "Garden patio seating area", caption: "Shaded outdoor garden patio" },
      { id: "gal-3", src: "/images/room-three.png", alt: "Ensuite bathroom interior", caption: "Walk-in rainfall shower" },
      { id: "gal-4", src: "/images/room-four.png", alt: "Coffee and tea setup", caption: "In-room tea & coffee" },
      { id: "gal-5", src: "/images/room-nine.png", alt: "Garden surroundings view", caption: "Manicured coastal gardens" },
    ]),
    related_room_ids_json: JSON.stringify([
      "lakeview-queen-balcony",
      "twin-courtyard",
      "family-suite",
    ]),
    sort_order: 2,
    is_featured: 0,
    is_published: 1,
  },
  {
    slug: "twin-courtyard",
    name: "Twin Courtyard",
    eyebrow: "ROOM COLLECTION",
    short_description:
      "Perfect for friends or families, with two comfortable beds.",
    price: 190,
    currency: "$",
    price_unit: "/ night",
    capacity_guests: 4,
    guests_label: "4 Guests",
    bed_configuration: "2 Queen Beds",
    area_m2: 38,
    area_label: "38 m²",
    view_label: "Courtyard View",
    balcony_label: null,
    seo_title: "Twin Courtyard | Cumberland Motor Inn",
    seo_description:
      "Ideal for friends and small families, our Twin Courtyard room features two queen beds and courtyard access.",
    intro_eyebrow: "SHARED COMFORT",
    intro_heading: "Ideal for groups & families.",
    intro_paragraph1:
      "The Twin Courtyard room is designed for flexibility, offering two plush queen beds, generous room proportions, and direct access to our central outdoor courtyard.",
    intro_paragraph2:
      "Enjoy modern entertainment options, crisp linens, and effortless access to the swimming pool area.",
    intro_feature_tiles_json: JSON.stringify([
      { id: "ft-1", icon: "person", label: "4 Guests" },
      { id: "ft-2", icon: "bed", label: "2 Queen Beds" },
      { id: "ft-3", icon: "area", label: "38 m²" },
      { id: "ft-4", icon: "view", label: "Courtyard View" },
    ]),
    stay_info_json: null,
    highlight_json: JSON.stringify([
      "Two queen beds sleeping up to 4 guests",
      "Direct central courtyard access",
      "Proximity to motel pool & BBQ",
      "Complimentary Wi-Fi & parking",
    ]),
    primary_image: "/images/room-three.png",
    gallery_json: JSON.stringify([
      { id: "gal-1", src: "/images/room-three.png", alt: "Twin Courtyard room with two queen beds", caption: "Two queen beds configuration" },
      { id: "gal-2", src: "/images/room-six.png", alt: "Courtyard view window", caption: "Sunny courtyard outlook" },
      { id: "gal-3", src: "/images/room-four.png", alt: "Bathroom vanity", caption: "Clean modern bathroom" },
      { id: "gal-4", src: "/images/room-five.png", alt: "Seating desk area", caption: "Desk & Smart TV setup" },
      { id: "gal-5", src: "/images/room-ten.png", alt: "Courtyard outdoor seating", caption: "Central courtyard access" },
    ]),
    related_room_ids_json: JSON.stringify([
      "lakeview-queen-balcony",
      "garden-king",
      "family-suite",
    ]),
    sort_order: 3,
    is_featured: 0,
    is_published: 1,
  },
  {
    slug: "family-suite",
    name: "Family Suite",
    eyebrow: "ROOM COLLECTION",
    short_description:
      "Extra space for special stays, with a separate living area.",
    price: 310,
    currency: "$",
    price_unit: "/ night",
    capacity_guests: 5,
    guests_label: "5 Guests",
    bed_configuration: "1 King + 2 Singles",
    area_m2: 52,
    area_label: "52 m²",
    view_label: "Ocean View",
    balcony_label: "Private Balcony",
    seo_title: "Family Suite | Cumberland Motor Inn",
    seo_description:
      "Spacious Family Suite with separate living room, ocean views, master king bed, and kitchenette.",
    intro_eyebrow: "SPACIOUS FAMILY LIVING",
    intro_heading: "Room for the whole family.",
    intro_paragraph1:
      "Our expansive Family Suite offers 52 square meters of premium living space. Features a separate master bedroom with a king bed, plus a second sleeping zone with two single beds.",
    intro_paragraph2:
      "Includes a generous lounge area, kitchenette with microwave and fridge, private balcony, and ocean views.",
    intro_feature_tiles_json: JSON.stringify([
      { id: "ft-1", icon: "person", label: "5 Guests" },
      { id: "ft-2", icon: "bed", label: "1 King + 2 Singles" },
      { id: "ft-3", icon: "area", label: "52 m²" },
      { id: "ft-4", icon: "balcony", label: "Private Balcony" },
    ]),
    stay_info_json: null,
    highlight_json: JSON.stringify([
      "52 m² with separate living & master bedroom",
      "Kitchenette with microwave, sink & fridge",
      "Private balcony with panoramic views",
      "Sleeps up to 5 guests comfortably",
    ]),
    primary_image: "/images/room-four.png",
    gallery_json: JSON.stringify([
      { id: "gal-1", src: "/images/room-four.png", alt: "Family Suite living room and balcony view", caption: "Separate living area with balcony" },
      { id: "gal-2", src: "/images/room-one.png", alt: "Master king bedroom suite", caption: "Master king bedroom" },
      { id: "gal-3", src: "/images/room-five.png", alt: "Second bedroom single beds", caption: "Second bedroom area" },
      { id: "gal-4", src: "/images/room-six.png", alt: "Kitchenette dining bar", caption: "Kitchenette & dining setup" },
      { id: "gal-5", src: "/images/room-eight.png", alt: "Large family bathroom", caption: "Family bathroom with tub & shower" },
      { id: "gal-6", src: "/images/room-ten.png", alt: "Balcony ocean view", caption: "Panoramic ocean balcony view" },
    ]),
    related_room_ids_json: JSON.stringify([
      "lakeview-queen-balcony",
      "garden-king",
      "twin-courtyard",
    ]),
    sort_order: 4,
    is_featured: 1,
    is_published: 1,
  },
  {
    slug: "cove-king",
    name: "Cove King",
    eyebrow: "ROOM COLLECTION",
    short_description:
      "A spacious king room with modern comforts and a private balcony.",
    price: 210,
    currency: "$",
    price_unit: "/ night",
    capacity_guests: 2,
    guests_label: "2 Guests",
    bed_configuration: "1 King Bed",
    area_m2: 32,
    area_label: "32 m²",
    view_label: "Cove View",
    balcony_label: "Private Balcony",
    seo_title: "Cove King | Cumberland Motor Inn",
    seo_description:
      "Relax in our Cove King room with private balcony, king bed, and modern coastal design.",
    intro_eyebrow: "COASTAL ELEGANCE",
    intro_heading: "Contemporary king comfort.",
    intro_paragraph1:
      "The Cove King room offers elevated coastal living with crisp design, plush king bedding, and a quiet private balcony overlooking the inlet.",
    intro_paragraph2:
      "Features a renovated walk-in rainfall shower, Smart TV, and dedicated work desk.",
    intro_feature_tiles_json: JSON.stringify([
      { id: "ft-1", icon: "person", label: "2 Guests" },
      { id: "ft-2", icon: "bed", label: "1 King Bed" },
      { id: "ft-3", icon: "area", label: "32 m²" },
      { id: "ft-4", icon: "balcony", label: "Private Balcony" },
    ]),
    stay_info_json: null,
    highlight_json: JSON.stringify([
      "Plush king bed",
      "Private balcony with inlet views",
      "Renovated ensuite shower",
      "Complimentary Wi-Fi and parking",
    ]),
    primary_image: "/images/room-one.png",
    gallery_json: JSON.stringify([
      { id: "gal-1", src: "/images/room-one.png", alt: "Cove King bedroom interior", caption: "Spacious Cove King interior" },
      { id: "gal-2", src: "/images/room-five.png", alt: "Balcony overlook", caption: "Private balcony with inlet view" },
      { id: "gal-3", src: "/images/room-seven.png", alt: "Renovated bathroom", caption: "Walk-in rainfall shower" },
      { id: "gal-4", src: "/images/room-eight.png", alt: "Smart TV and desk", caption: "Work desk & smart entertainment" },
    ]),
    related_room_ids_json: JSON.stringify([
      "lakeview-queen-balcony",
      "ocean-twin",
      "family-suite",
    ]),
    sort_order: 5,
    is_featured: 1,
    is_published: 1,
  },
  {
    slug: "ocean-twin",
    name: "Ocean Twin",
    eyebrow: "ROOM COLLECTION",
    short_description:
      "Perfect for friends or families, with two comfortable queen beds.",
    price: 230,
    currency: "$",
    price_unit: "/ night",
    capacity_guests: 4,
    guests_label: "4 Guests",
    bed_configuration: "2 Queen Beds",
    area_m2: 36,
    area_label: "36 m²",
    view_label: "Ocean View",
    balcony_label: "Private Balcony",
    seo_title: "Ocean Twin | Cumberland Motor Inn",
    seo_description:
      "Stay in our Ocean Twin room featuring two queen beds, private balcony, and ocean views.",
    intro_eyebrow: "OCEANFRONT COMFORT",
    intro_heading: "Breathtaking ocean views.",
    intro_paragraph1:
      "Wake up to the sound of rolling waves in our Ocean Twin room. Equipped with two queen beds, private balcony, and floor-to-ceiling glass doors.",
    intro_paragraph2:
      "Accommodates up to 4 guests with full modern amenities and coastal styling.",
    intro_feature_tiles_json: JSON.stringify([
      { id: "ft-1", icon: "person", label: "4 Guests" },
      { id: "ft-2", icon: "bed", label: "2 Queen Beds" },
      { id: "ft-3", icon: "area", label: "36 m²" },
      { id: "ft-4", icon: "balcony", label: "Private Balcony" },
    ]),
    stay_info_json: null,
    highlight_json: JSON.stringify([
      "Two queen beds sleeping 4 guests",
      "Private balcony with ocean views",
      "High-speed Wi-Fi & Smart TV",
      "Complimentary on-site parking",
    ]),
    primary_image: "/images/room-two.png",
    gallery_json: JSON.stringify([
      { id: "gal-1", src: "/images/room-two.png", alt: "Ocean Twin room with two queen beds", caption: "Two queen beds with ocean view" },
      { id: "gal-2", src: "/images/room-six.png", alt: "Balcony looking towards ocean", caption: "Oceanfront private balcony" },
      { id: "gal-3", src: "/images/room-nine.png", alt: "Bathroom vanity", caption: "Modern bathroom interior" },
      { id: "gal-4", src: "/images/room-ten.png", alt: "Seating corner", caption: "Lounge corner with tea & coffee" },
    ]),
    related_room_ids_json: JSON.stringify([
      "lakeview-queen-balcony",
      "cove-king",
      "family-suite",
    ]),
    sort_order: 6,
    is_featured: 1,
    is_published: 1,
  },
];

const COLS = [
  "slug",
  "name",
  "eyebrow",
  "short_description",
  "price",
  "currency",
  "price_unit",
  "capacity_guests",
  "guests_label",
  "bed_configuration",
  "area_m2",
  "area_label",
  "view_label",
  "balcony_label",
  "seo_title",
  "seo_description",
  "intro_eyebrow",
  "intro_heading",
  "intro_paragraph1",
  "intro_paragraph2",
  "intro_feature_tiles_json",
  "stay_info_json",
  "highlight_json",
  "primary_image",
  "gallery_json",
  "related_room_ids_json",
  "sort_order",
  "is_featured",
  "is_published",
];

async function upsertRoom(conn, row) {
  const placeholders = COLS.map(() => "?").join(", ");
  const updates = COLS.map((c) => `${c}=VALUES(${c})`).join(", ");
  const values = COLS.map((c) => row[c]);
  await conn.query(
    `INSERT INTO rooms (${COLS.join(", ")}) VALUES (${placeholders})
     ON DUPLICATE KEY UPDATE ${updates}`,
    values
  );
}

async function run() {
  const conn = await db.getConnection();
  try {
    let inserted = 0;
    let updated = 0;
    for (const r of ROOMS) {
      const [rows] = await conn.query(
        "SELECT id, slug FROM rooms WHERE slug = ? LIMIT 1",
        [r.slug]
      );
      if (rows.length) updated += 1;
      else inserted += 1;
      await upsertRoom(conn, r);
    }
    console.log(`\n✅ Rooms seed complete: ${inserted} inserted, ${updated} updated (${ROOMS.length} total)\n`);
    process.exit(0);
  } catch (err) {
    console.error("Rooms seed failed:", err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

run();
