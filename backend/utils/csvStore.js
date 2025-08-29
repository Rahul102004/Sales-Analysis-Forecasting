const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const datasetPath = path.join(__dirname, "../dataset.csv");

let rows = [];

// Load dataset into memory
function load() {
  try {
    const fileContent = fs.readFileSync(datasetPath, "utf8");
    rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    console.log("✅ Dataset loaded:", rows.length, "rows");
  } catch (err) {
    console.error("❌ Failed to load dataset.csv:", err.message);
  }
}

// Retrieve all rows
function retrieve() {
  return rows;
}

// Search helper (optional)
function search(query) {
  if (!query) return rows;
  const lower = query.toLowerCase();
  return rows.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(lower)
    )
  );
}

module.exports = { load, retrieve, search };
