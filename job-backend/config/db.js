const { Pool } = require("pg");
require("dotenv").config();

// Debug log: in ra xem dotenv có đọc đúng không
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "****" : "(empty)");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test kết nối
pool.query("SELECT NOW()")
  .then(res => console.log("✅ Connected to PostgreSQL at:", res.rows[0].now))
  .catch(err => console.error("❌ Database connection error:", err));

module.exports = pool;
