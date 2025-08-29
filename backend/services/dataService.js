function calcTotals(data) {
  const totals = {};
  data.forEach((d) => {
    const prod = d.Product;
    totals[prod] = (totals[prod] || 0) + Number(d.Sales || 0);
  });
  return Object.entries(totals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

module.exports = { calcTotals };
