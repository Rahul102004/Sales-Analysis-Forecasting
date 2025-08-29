function chartData(data) {
  if (!data.length) return { points: [], xlabels: [] };

  const monthlyMax = {};

  data.forEach((d) => {
    const date = new Date(d.Date);
    if (isNaN(date)) return;

    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!monthlyMax[monthKey] || d.Sales > monthlyMax[monthKey].Sales) {
      monthlyMax[monthKey] = { Date: d.Date, Sales: d.Sales };
    }
  });

  const sorted = Object.entries(monthlyMax).sort(
    (a, b) => new Date(a[1].Date) - new Date(b[1].Date)
  );

  return {
    points: sorted.map(([_, val]) => Number(val.Sales || 0)),
    xlabels: sorted.map(([_, val]) => val.Date || "N/A"),
  };
}

module.exports = { chartData };
