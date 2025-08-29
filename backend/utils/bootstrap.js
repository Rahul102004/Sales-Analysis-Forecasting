const pool = require("../config/db");

async function bootstrap() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL DEFAULT 0,
      status ENUM('High','Medium','Low') NOT NULL DEFAULT 'High',
      lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

module.exports = bootstrap;
