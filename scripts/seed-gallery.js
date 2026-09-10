import "dotenv/config";
import db from "../config/database.js";

const GALLERY_SEED = [
  {
    title: "Pool & Sun Deck",
    category: "Property",
    image: "/images/gallery-one.png",
    alt: "Cumberland Motor Inn swimming pool and sun loungers under palm trees",
    description: "Relax by our heated outdoor pool with sweeping ocean views.",
    media_type: "image",
    layout: "wide",
    route: "/about#amenities",
    sort_order: 1,
    is_published: 1,
  },
  {
    title: "Ocean View Room",
    category: "Rooms",
    image: "/images/room-one.png",
    alt: "Spacious king bedroom with private balcony facing the water",
    description: "Wake up to stunning ocean views from your private balcony.",
    media_type: "image",
    layout: "wide",
    route: "/rooms/cove-king",
    sort_order: 2,
    is_published: 1,
  },
  {
    title: "Our Boutique Motel",
    category: "Property",
    image: "/images/content-image-one.png",
    alt: "Renovated two-storey motel exterior and landscaped entrance",
    description: "Renovated coastal architecture surrounded by tropical gardens.",
    media_type: "image",
    layout: "standard",
    route: "/about",
    sort_order: 3,
    is_published: 1,
  },
  {
    title: "Waterfront Dining",
    category: "Dining",
    image: "/images/eat-drink.png",
    alt: "Outdoor dining table with wine glasses overlooking the water",
    description: "Enjoy local flavors and fresh seafood by the water.",
    media_type: "image",
    layout: "standard",
    route: "/experiences/eat-and-drink",
    sort_order: 4,
    is_published: 1,
  },
  {
    title: "Cumberland Beach",
    category: "Local Area",
    image: "/images/gallery-three.png",
    alt: "Secluded sandy cove and turquoise ocean bay",
    description: "Pristine beaches and quiet swimming coves just moments away.",
    media_type: "image",
    layout: "standard",
    route: "/experiences/things-to-do",
    sort_order: 5,
    is_published: 1,
  },
  {
    title: "Family Suite & Lounge",
    category: "Rooms",
    image: "/images/room-three.png",
    alt: "Spacious family suite with living area and comfortable seating",
    description: "Extra space for special family getaways and longer stays.",
    media_type: "image",
    layout: "standard",
    route: "/rooms/family-suite",
    sort_order: 6,
    is_published: 1,
  },
  {
    title: "BBQ & Outdoor Area",
    category: "Amenities",
    image: "/images/gallery-four.png",
    alt: "Shaded outdoor barbecue area and dining tables",
    description: "Gather with family and friends in our outdoor barbecue area.",
    media_type: "image",
    layout: "standard",
    route: "/about#amenities",
    sort_order: 7,
    is_published: 1,
  },
  {
    title: "Wine Country",
    category: "Experiences",
    image: "/images/wine-country.png",
    alt: "Picturesque vineyard rows during golden hour sunset",
    description: "Cellar doors, scenic drives and world-class regional wines.",
    media_type: "image",
    layout: "standard",
    route: "/experiences/wine-country",
    sort_order: 8,
    is_published: 1,
  },
  {
    title: "Private Balcony Room",
    category: "Rooms",
    image: "/images/gallery-two.png",
    alt: "Guest room interior with open sliding glass doors to balcony",
    description: "Boutique accommodations designed for real rest and relaxation.",
    media_type: "image",
    layout: "standard",
    route: "/rooms/ocean-twin",
    sort_order: 9,
    is_published: 1,
  },
  {
    title: "Coastal Adventures",
    category: "Experiences",
    image: "/images/thinks-to-do.png",
    alt: "Kayakers paddling across calm blue ocean water at dusk",
    description: "Explore coastal walking trails, bike paths and kayaking bays.",
    media_type: "image",
    layout: "tall",
    route: "/experiences/things-to-do",
    sort_order: 10,
    is_published: 1,
  },
];

async function seedGallery() {
  console.log("\n🖼️  Cumberland Motor Inn - Gallery Media Seeder\n");

  try {
    await db.query("SELECT 1 as ping");

    let inserted = 0;
    let updated = 0;

    for (const item of GALLERY_SEED) {
      const [[existing]] = await db.query(
        "SELECT id FROM gallery_media WHERE title = ? AND image = ?",
        [item.title, item.image]
      );

      if (existing) {
        updated++;
      } else {
        await db.query(
          `INSERT INTO gallery_media
            (title, category, image, alt, description, media_type, layout, \`route\`, sort_order, is_published)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.title,
            item.category,
            item.image,
            item.alt,
            item.description,
            item.media_type,
            item.layout,
            item.route,
            item.sort_order,
            item.is_published,
          ]
        );
        inserted++;
      }
    }

    console.log("✅ Gallery media seeded successfully!\n");
    console.log(`   Inserted  : ${inserted}`);
    console.log(`   Kept (existing) : ${updated}`);
    console.log(`   Total     : ${inserted + updated} items\n`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Gallery seeding failed:");
    console.error("   ", err.message);
    console.error("");
    console.error("Make sure:");
    console.error("   1. MySQL is running (start XAMPP/WAMP/MySQL server)");
    console.error("   2. Database 'cumberland_motor_inn' exists");
    console.error("   3. Run database/schema.sql first in PHPMyAdmin");
    console.error("   4. Credentials in .env are correct\n");
    process.exit(1);
  }
}

seedGallery();
