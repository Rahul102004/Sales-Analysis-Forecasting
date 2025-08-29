import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Sun } from "lucide-react";

export default function SalesAnalytics() {
  const [dashboardData, setDashboardData] = useState(null);
  const [selected, setSelected] = useState("overall"); // default view

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/dashboard")
      .then((res) => res.json())
      .then((data) => setDashboardData(data))
      .catch((err) => console.error("Error fetching dashboard data:", err));
  }, []);

  if (!dashboardData) {
    return <p className="text-white">Loading analytics...</p>;
  }

  // Pick data based on dropdown selection
  const selectedData =
    selected === "overall"
      ? dashboardData.overall
      : dashboardData.products.find((p) => p.id === selected);

  const { kpi, salesTrend } = selectedData;

  // Convert backend chart data to Recharts-friendly format
  const chartData = salesTrend.chart.labels.map((label, idx) => ({
    date: label,
    actual: salesTrend.chart.datasets[0].data[idx],
    forecast: salesTrend.chart.datasets[1].data[idx],
  }));

  return (
    <div className="flex-1 text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Sales Analytics</h2>
        <span className="text-sm text-[#AAB6CA]">Jana Dzousa | Sales Manager</span>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          className="bg-transparent border border-[#0b1737] text-[#AAB6CA] px-3 py-2 rounded"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="overall" className="bg-[#0b1737]">
            Overall Products
          </option>
          {dashboardData.products.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#0b1737]">
              {p.id}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-[#0b1737] p-4 rounded-xl">
          <p className="text-[#AAB6CA]">Total sales</p>
          <h3 className="text-2xl font-bold">
            {kpi.totalSales.value}{" "}
            <span
              className={`ml-2 text-sm ${
                kpi.totalSales.trend === "up"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {kpi.totalSales.percentageChange}
            </span>
          </h3>
        </div>

        <div className="bg-[#0b1737] p-4 rounded-xl">
          <p className="text-[#AAB6CA]">Predicted Sales</p>
          <h3 className="text-2xl font-bold">
            {kpi.predictedSales.value}{" "}
            <span
              className={`ml-2 text-sm ${
                kpi.predictedSales.trend === "up"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {kpi.predictedSales.percentageChange}
            </span>
          </h3>
          <p className="text-[#AAB6CA] text-sm">
            in {kpi.predictedSales.period}
          </p>
        </div>

        <div className="bg-[#0b1737] p-4 rounded-xl flex gap-2">
          <Sun className="text-[#36D0E4]" />
          <div>
            <p className="text-[#AAB6CA]">Smart Recommendation</p>
            <p className="text-white font-medium">
              {kpi.smartRecommendation.message}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[#0b1737] rounded-2xl p-4">
        <p className="text-[#AAB6CA] mb-2">
          {selected === "overall"
            ? "Overall Sales Trend"
            : `Sales Trend for ${selected}`}
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#152145" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#AAB6CA" />
            <YAxis stroke="#AAB6CA" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0b1737",
                border: "1px solid #0b1737",
                color: "white",
              }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#2EACC1"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2EACC1" }}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#36D0E4"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={{ r: 3, fill: "#36D0E4" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
