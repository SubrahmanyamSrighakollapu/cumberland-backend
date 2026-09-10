import "dotenv/config";
import db from "../config/database.js";

const FAQS_SEED = [
  {
    question: "What time is check-in and check-out?",
    answer:
      "Check-in starts from 2:00 PM. Please contact reception to confirm check-out times or discuss an early arrival or late departure.",
    category: "General",
    sort_order: 1,
    is_published: 1,
  },
  {
    question: "Is parking available?",
    answer:
      "Complimentary on-site parking is available for guests. Contact our team if you have specific vehicle or access requirements.",
    category: "General",
    sort_order: 2,
    is_published: 1,
  },
  {
    question: "Do you offer EV charging?",
    answer:
      "EV charging is available on site. Please contact reception before arrival to confirm access and availability.",
    category: "Amenities",
    sort_order: 3,
    is_published: 1,
  },
  {
    question: "Can I request an accessible room?",
    answer:
      "Please contact our team before booking so we can discuss your access requirements and suitable room options.",
    category: "Rooms",
    sort_order: 4,
    is_published: 1,
  },
  {
    question: "How do I change or cancel a booking?",
    answer:
      "Please contact the provider you booked through or speak with our team. Changes and cancellations depend on the terms of your reservation.",
    category: "Bookings",
    sort_order: 5,
    is_published: 1,
  },
  {
    question: "Are pets allowed?",
    answer:
      "We love pets but we are not pet-friendly at Cumberland Motor Inn. Please speak with our team about nearby pet-friendly accommodation options in the area.",
    category: "General",
    sort_order: 6,
    is_published: 1,
  },
  {
    question: "Is breakfast included with my stay?",
    answer:
      "Breakfast options vary by room type. Please check your booking details or contact our team for current breakfast options and pricing.",
    category: "Dining",
    sort_order: 7,
    is_published: 1,
  },
];

async function seedFaqs() {
  console.log("\n[?]  Cumberland Motor Inn - FAQ Items Seeder\n");

  try {
    await db.query("SELECT 1 as ping");

    let inserted = 0;
    let updated = 0;

    for (const item of FAQS_SEED) {
      const [[existing]] = await db.query(
        "SELECT id FROM faq_items WHERE question = ?",
        [item.question]
      );

      if (existing) {
        await db.query(
          `UPDATE faq_items
             SET answer = ?, category = ?, sort_order = ?, is_published = ?
           WHERE id = ?`,
          [
            item.answer,
            item.category,
            item.sort_order,
            item.is_published,
            existing.id,
          ]
        );
        updated++;
      } else {
        await db.query(
          `INSERT INTO faq_items
            (question, answer, category, sort_order, is_published)
           VALUES (?, ?, ?, ?, ?)`,
          [
            item.question,
            item.answer,
            item.category,
            item.sort_order,
            item.is_published,
          ]
        );
        inserted++;
      }
    }

    console.log("[OK] FAQ items seeded successfully!\n");
    console.log(`   Inserted  : ${inserted}`);
    console.log(`   Updated   : ${updated}`);
    console.log(`   Total     : ${inserted + updated} items\n`);

    process.exit(0);
  } catch (err) {
    console.error("[ERR] FAQ seeding failed:");
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

seedFaqs();
