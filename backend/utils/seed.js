const pool = require("../config/db");

async function seed() {
  // ✅ Ensure table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL DEFAULT 0,
      status ENUM('High','Medium','Low') NOT NULL DEFAULT 'High',
      lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // ✅ Check if already seeded
  const [rows] = await pool.query("SELECT COUNT(*) as count FROM inventory");
  if (rows[0].count > 0) {
    console.log("ℹ️ Inventory already seeded, skipping.");
    return;
  }

  // ✅ Your 8 product codes
  const sample = [
    ["M01AB", "M01AB Product", 100, "High"],
    ["M01AE", "M01AE Product", 80, "Medium"],
    ["N02BA", "N02BA Product", 60, "Low"],
    ["N02BE", "N02BE Product", 90, "High"],
    ["N05B", "N05B Product", 50, "Medium"],
    ["N05C", "N05C Product", 70, "Low"],
    ["R03", "R03 Product", 40, "High"],
    ["R06", "R06 Product", 30, "Medium"],
  ];

  for (const row of sample) {
    await pool.query(
      "INSERT INTO inventory (id, name, quantity, status) VALUES (?, ?, ?, ?)",
      row
    );
  }

  console.log("✅ Inventory seed data inserted with 8 product codes");
}

module.exports = seed;
