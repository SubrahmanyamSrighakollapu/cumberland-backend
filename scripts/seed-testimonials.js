import "dotenv/config";
import db from "../config/database.js";

const TESTIMONIALS_SEED = [
  {
    name: "Emma R.",
    date_text: "April 2025",
    rating: 5,
    quote:
      "The perfect weekend escape. Beautiful location, stylish rooms and such a relaxed vibe.",
    avatar: "/images/client-image-one.png",
    avatar_alt: "Emma R. guest portrait",
    is_featured: 1,
    sort_order: 1,
    is_published: 1,
  },
  {
    name: "Liam T.",
    date_text: "March 2025",
    rating: 5,
    quote:
      "Amazing views, super clean rooms and the friendliest team. We'll definitely be back!",
    avatar: "/images/client-image-two.png",
    avatar_alt: "Liam T. guest portrait",
    is_featured: 1,
    sort_order: 2,
    is_published: 1,
  },
  {
    name: "Sophie M.",
    date_text: "February 2025",
    rating: 5,
    quote:
      "A little slice of paradise. Close to everything but feels like a world away.",
    avatar: "/images/client-image-three.png",
    avatar_alt: "Sophie M. guest portrait",
    is_featured: 1,
    sort_order: 3,
    is_published: 1,
  },
  {
    name: "Sarah L.",
    date_text: "March 2025",
    rating: 5,
    quote:
      "The perfect base for exploring the coast. Clean, comfortable and the friendliest staff. We'll definitely be back!",
    avatar: "/images/room-one.png",
    avatar_alt:
      "King guest room with private balcony overlooking coastal scenery",
    is_featured: 0,
    sort_order: 4,
    is_published: 1,
  },
  {
    name: "Daniel K.",
    date_text: "January 2025",
    rating: 5,
    quote:
      "Our family had the best holiday here. The pool area was fantastic and the kids loved the beach nearby.",
    avatar: "/images/gallery-one.png",
    avatar_alt: "Daniel K. family holiday snapshot by the pool",
    is_featured: 0,
    sort_order: 5,
    is_published: 1,
  },
  {
    name: "Olivia P.",
    date_text: "April 2025",
    rating: 5,
    quote:
      "Such a peaceful and welcoming place. Great food recommendations from the staff made our anniversary trip extra special.",
    avatar: "/images/eat-drink.png",
    avatar_alt: "Olivia P. dining portrait",
    is_featured: 1,
    sort_order: 6,
    is_published: 1,
  },
];

async function seedTestimonials() {
  console.log("\n💬  Cumberland Motor Inn - Testimonials Seeder\n");

  try {
    await db.query("SELECT 1 as ping");

    let inserted = 0;
    let updated = 0;

    for (const item of TESTIMONIALS_SEED) {
      const [[existing]] = await db.query(
        "SELECT id FROM testimonials WHERE name = ? AND date_text = ?",
        [item.name, item.date_text]
      );

      if (existing) {
        await db.query(
          `UPDATE testimonials
             SET rating = ?, quote = ?, avatar = ?, avatar_alt = ?,
                 is_featured = ?, sort_order = ?, is_published = ?
           WHERE id = ?`,
          [
            item.rating,
            item.quote,
            item.avatar,
            item.avatar_alt,
            item.is_featured,
            item.sort_order,
            item.is_published,
            existing.id,
          ]
        );
        updated++;
      } else {
        await db.query(
          `INSERT INTO testimonials
            (name, date_text, rating, quote, avatar, avatar_alt, is_featured, sort_order, is_published)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.name,
            item.date_text,
            item.rating,
            item.quote,
            item.avatar,
            item.avatar_alt,
            item.is_featured,
            item.sort_order,
            item.is_published,
          ]
        );
        inserted++;
      }
    }

    console.log("✅ Testimonials seeded successfully!\n");
    console.log(`   Inserted  : ${inserted}`);
    console.log(`   Updated   : ${updated}`);
    console.log(`   Total     : ${inserted + updated} items\n`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Testimonials seeding failed:");
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

seedTestimonials();
