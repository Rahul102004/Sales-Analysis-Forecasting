const regression = require("regression");

async function getForecast(points) {
  try {
    if (!points || points.length < 2) return "N/A";

    const data = points.map((val, i) => [i, val]);
    const result = regression.linear(data);
    const next = result.predict(points.length)[1];

    const lastActual = points[points.length - 1];
    if (!lastActual || lastActual === 0) return "N/A";

    const percentGrowth = ((next - lastActual) / lastActual) * 100;
    console.log("✅ Forecast % growth:", percentGrowth.toFixed(2) + "%");

    return percentGrowth.toFixed(2);
  } catch (err) {
    console.error("❌ Forecast error:", err.message);
    return "N/A";
  }
}

module.exports = { getForecast };
