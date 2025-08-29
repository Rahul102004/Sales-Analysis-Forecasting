const fs = require("fs");
const csv = require("csv-parser");

let dataset = [];

function loadCSV() {
  dataset = []; // reset if hot reload
  fs.createReadStream("dataset.csv")
    .pipe(csv())
    .on("data", (row) => {
      const date = row["datum"];
      Object.keys(row).forEach((col) => {
        if (col !== "datum") {
          dataset.push({
            Product: col,
            Sales: Number(row[col] || 0),
            Date: date,
          });
        }
      });
    })
    .on("end", () => {
      console.log("✅ CSV Loaded. First 10 rows:");
      console.log(dataset.slice(0, 10));
    });
}

function getDataset() {
  return dataset;
}

module.exports = { loadCSV, getDataset };
