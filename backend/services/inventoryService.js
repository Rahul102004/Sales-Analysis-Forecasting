const pool = require("../config/db");

async function getAll() {
  const [rows] = await pool.query("SELECT * FROM inventory ORDER BY lastUpdated DESC");
  return rows;
}

async function getStats() {
  const [stocks] = await pool.query("SELECT SUM(quantity) as totalStocks FROM inventory");
  const [types] = await pool.query("SELECT COUNT(*) as productTypesCount FROM inventory");
  const [oldest] = await pool.query("SELECT MIN(lastUpdated) as oldestStockDate FROM inventory");
  const [latest] = await pool.query("SELECT MAX(lastUpdated) as latestStockDate FROM inventory");

  return {
    totalStocks: stocks[0].totalStocks || 0,
    productTypesCount: types[0].productTypesCount || 0,
    oldestStockDate: oldest[0].oldestStockDate,
    latestStockDate: latest[0].latestStockDate,
  };
}

async function create(item) {
  await pool.query(
    "INSERT INTO inventory (id, name, quantity, status) VALUES (?, ?, ?, ?)",
    [item.id, item.name, item.quantity, item.status]
  );
}

async function update(id, item) {
  await pool.query(
    "UPDATE inventory SET name=?, quantity=?, status=?, lastUpdated=NOW() WHERE id=?",
    [item.name, item.quantity, item.status, id]
  );
}

async function remove(id) {
  await pool.query("DELETE FROM inventory WHERE id=?", [id]);
}

module.exports = { getAll, getStats, create, update, remove };
