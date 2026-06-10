const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bookstore",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verifica la conexión al iniciar
pool
  .getConnection()
  .then((conn) => {
    console.log("✅ Conectado a MariaDB");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Error conectando a MariaDB:", err.message);
  });

module.exports = pool;
