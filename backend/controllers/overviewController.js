const { getDataset } = require("../config/dbLoader");
const { calcTotals } = require("../services/dataService");
const { getForecast } = require("../services/forecastService");
const { chartData } = require("../utils/chartUtils");

// List products
const listProducts = (req, res) => {
  const dataset = getDataset();
  const prods = [...new Set(dataset.map((d) => d.Product))];
  console.log("🛒 Products:", prods);
  res.json(prods);
};

// Overview (all products)
const getOverview = async (req, res) => {
  const dataset = getDataset();
  console.log("⚡ /api/overview called");

  const totalSales = dataset.reduce((a, d) => a + Number(d.Sales || 0), 0);
  const prodTotals = calcTotals(dataset);
  const chart = chartData(dataset);
  const forecast = await getForecast(chart.points);

  const response = {
    totalSales,
    growth: (
      ((chart.points[chart.points.length - 1] - chart.points[0]) /
        (chart.points[0] || 1)) *
      100
    ).toFixed(2),
    forecast,
    topProduct: prodTotals[0]?.name || "N/A",
    chart,
    top5: prodTotals.slice(0, 5),
  };

  res.json(response);
};

// Overview by product
const getProductOverview = async (req, res) => {
  const dataset = getDataset();
  const prod = req.params.product;
  console.log(`⚡ /api/overview/${prod} called`);

  const filtered = dataset.filter((d) => d.Product === prod);
  const totalSales = filtered.reduce((a, d) => a + Number(d.Sales || 0), 0);
  const chart = chartData(filtered);
  const forecast = await getForecast(chart.points);

  const response = {
    totalSales,
    growth: (
      ((chart.points[chart.points.length - 1] - chart.points[0]) /
        (chart.points[0] || 1)) *
      100
    ).toFixed(2),
    forecast,
    topProduct: prod,
    chart,
    top5: [{ name: prod, total: totalSales }],
  };

  res.json(response);
};

module.exports = { listProducts, getOverview, getProductOverview };
