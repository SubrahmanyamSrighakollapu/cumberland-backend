import "dotenv/config";
import db from "../config/database.js";

const INQUIRIES_SEED = [
  {
    full_name: "Jessica Bennett",
    email: "jessica.bennett@example.com",
    phone: "0412 345 678",
    subject: "Booking Enquiry",
    message:
      "Hi team, I'd love to book a 2-night stay for two adults in early November. Do you have any ocean view king rooms available around the 8th? Thanks, Jessica.",
    status: "new",
    is_spam: 0,
    reply_sent: 0,
  },
  {
    full_name: "Mark Thompson",
    email: "mark.thompson@example.com",
    phone: "0423 456 789",
    subject: "Wedding Accommodation",
    message:
      "Hello! We're getting married in Bayside in March next year and need to hold a block of 8-10 rooms for our guests. Could you please share your group rates and availability for the weekend of 14-16 March?",
    status: "read",
    is_spam: 0,
    reply_sent: 0,
  },
  {
    full_name: "Amanda Clarke",
    email: "amanda.c@example.com",
    phone: null,
    subject: "Accessibility Question",
    message:
      "Good morning, my elderly mother is in a wheelchair and we're wondering about accessible room options. We'd appreciate any details about ground-floor rooms, ensuite access and parking proximity. Many thanks, Amanda.",
    status: "replied",
    is_spam: 0,
    reply_sent: 1,
  },
  {
    full_name: "Priya Shah",
    email: "priya.shah@example.com",
    phone: "0431 222 333",
    subject: "Restaurant Recommendation",
    message:
      "Hi, we're staying with you next week — can you recommend some nice dinner spots within walking distance? We love fresh seafood and casual dining.",
    status: "archived",
    is_spam: 0,
    reply_sent: 1,
  },
  {
    full_name: "Cheap Flights Deals <spam>",
    email: "noreply@spammail.zz",
    phone: null,
    subject: "WIN a FREE holiday!!!",
    message:
      "Congratulations! You've been selected for a COMPLIMENTARY 5 night stay anywhere. Click here to claim your prize now. Offer ends soon.",
    status: "archived",
    is_spam: 1,
    reply_sent: 0,
  },
];

async function seedContactInquiries() {
  console.log("\n📬  Cumberland Motor Inn - Contact Inquiries Seeder\n");

  try {
    await db.query("SELECT 1 as ping");

    let inserted = 0;
    let skipped = 0;

    for (const item of INQUIRIES_SEED) {
      const [[existing]] = await db.query(
        "SELECT id FROM contact_inquiries WHERE full_name = ? AND email = ? AND message = ?",
        [item.full_name, item.email, item.message]
      );

      if (existing) {
        skipped++;
      } else {
        await db.query(
          `INSERT INTO contact_inquiries
            (full_name, email, phone, subject, message, status, is_spam, reply_sent)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.full_name,
            item.email,
            item.phone,
            item.subject,
            item.message,
            item.status,
            item.is_spam,
            item.reply_sent,
          ]
        );
        inserted++;
      }
    }

    const [rows] = await db.query(
      "SELECT status, COUNT(*) as c FROM contact_inquiries GROUP BY status"
    );
    const breakdown = rows.map((r) => `${r.status}=${r.c}`).join(", ");

    console.log("✅ Contact inquiries seeded successfully!\n");
    console.log(`   Inserted  : ${inserted}`);
    console.log(`   Skipped (existing): ${skipped}`);
    console.log(`   Statuses  : ${breakdown}\n`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Contact inquiries seeding failed:");
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

seedContactInquiries();
