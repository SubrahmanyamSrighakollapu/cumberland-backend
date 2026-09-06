import mysql from "mysql2/promise";
import config from "./config.js";

const pool = mysql.createPool(config.db);

pool
  .getConnection()
  .then((conn) => {
    console.log("✅ MySQL connected successfully");
    console.log(`   Host: ${config.db.host}:${config.db.port}`);
    console.log(`   Database: ${config.db.database}`);
    conn.release();
  })
  .catch((err) => {
    console.warn("⚠️  MySQL connection failed (start PHPMyAdmin / MySQL first)");
    console.warn(`   Error: ${err.message}`);
    console.warn("   Run the SQL schema file before using the API\n");
  });

export default pool;
