import "dotenv/config";
import bcrypt from "bcryptjs";
import db from "../config/database.js";
import config from "../config/config.js";

async function seedAdminUser() {
  console.log("\n🌱 Cumberland Motor Inn - Admin User Seeder\n");

  try {
    const hashedPassword = await bcrypt.hash(
      config.admin.defaultPassword,
      config.bcrypt.saltRounds
    );

    const sql = `
      INSERT INTO admin_users (name, email, password, role, is_active)
      VALUES (?, ?, ?, 'admin', 1)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        password = VALUES(password),
        role = VALUES(role),
        is_active = 1
    `;

    await db.query(sql, [
      "Cumberland Admin",
      config.admin.defaultEmail.toLowerCase(),
      hashedPassword,
    ]);

    console.log("✅ Admin user seeded successfully!");
    console.log("");
    console.log("   Email    :", config.admin.defaultEmail);
    console.log("   Password :", config.admin.defaultPassword);
    console.log("   Role     : admin");
    console.log("");

    console.log("⚠️   IMPORTANT: Change the default password via the CMS after first login!");
    console.log("");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:");
    console.error("   ", err.message);
    console.error("");
    console.error("Make sure:");
    console.error("   1. MySQL is running (start XAMPP/WAMP/MySQL server)");
    console.error("   2. Database 'cumberland_motor_inn' exists");
    console.error("   3. Run database/schema.sql first in PHPMyAdmin");
    console.error("   4. Credentials in .env are correct");
    console.error("");
    process.exit(1);
  }
}

seedAdminUser();
