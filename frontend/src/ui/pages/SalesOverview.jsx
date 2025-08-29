import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export default function SalesOverview() {
  const [overview, setOverview] = useState({
    totalSales: 0,
    growth: 0,
    forecast: "N/A",
    topProduct: "N/A",
    chart: { points: [], xlabels: [] },
    top5: [],
  });

  const [products, setProducts] = useState([]); // list of all products
  const [selectedProduct, setSelectedProduct] = useState("All"); // current selection

  // Fetch product list
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, []);

  // Fetch overview data (all or specific product)
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const url =
          selectedProduct === "All"
            ? "http://localhost:5000/api/overview"
            : `http://localhost:5000/api/overview/${selectedProduct}`;

        const res = await fetch(url);
        const data = await res.json();
        setOverview(data);
      } catch (err) {
        console.error("Error fetching overview:", err);
      }
    };
    fetchOverview();
  }, [selectedProduct]);

  return (
    <div className="p-6 space-y-6 text-white">
      {/* Header with dropdown */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Sales Overview</h2>
        <select
          className="bg-[#0b1c3a] text-white px-4 py-2 rounded-xl border border-gray-600"
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
        >
          <option value="All">All Products</option>
          {products.map((p, idx) => (
            <option key={idx} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0b1c3a] rounded-2xl shadow p-4">
          <p className="text-gray-400">Total Sales</p>
          <h3 className="text-xl font-bold">{Math.round(overview.totalSales)}</h3>
        </div>

        {/* Dynamic title here */}
        <div className="bg-[#0b1c3a] rounded-2xl shadow p-4">
          <p className="text-gray-400">
            {selectedProduct === "All" ? "Top Selling Product" : "Product Name"}
          </p>
          <h3 className="text-xl font-bold">{overview.topProduct}</h3>
        </div>

        <div className="bg-[#0b1c3a] rounded-2xl shadow p-4">
          <p className="text-gray-400">Sales Growth %</p>
          <h3 className="text-xl font-bold">
            {overview.growth ? `${Math.round(overview.growth)}%` : "0%"}
          </h3>
        </div>
        <div className="bg-[#0b1c3a] rounded-2xl shadow p-4">
          <p className="text-gray-400">Sales Forecast %</p>
          <h3 className="text-xl font-bold">
            {overview.forecast !== "N/A" ? `${overview.forecast}%` : "N/A"}
          </h3>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-[#0b1c3a] rounded-2xl shadow p-6">
        <h3 className="text-gray-300 mb-4 font-semibold">Total Sales</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={overview.chart.points.map((p, i) => ({
              value: Math.round(p),
              label: overview.chart.xlabels[i],
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="label" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#00c3ff"
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 / Overall Sales + Inventory side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 or Overall Sales (Bar Chart) */}
        <div className="bg-[#0b1c3a] rounded-2xl shadow p-6">
          <h3 className="text-gray-300 mb-4 font-semibold">
            {selectedProduct === "All" ? "Top 5 Selling Products" : "Overall Sales"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={overview.top5.map((p) => ({
                name: p.name,
                total: Math.round(p.total),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip
                formatter={(v) =>
                  new Intl.NumberFormat("en-US", {
                    maximumFractionDigits: 0,
                  }).format(v)
                }
              />
              <Bar dataKey="total" fill="#00c3ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Static Inventory Overview */}
        <div className="bg-[#0b1c3a] rounded-2xl shadow p-6 flex flex-col">
          <h3 className="text-gray-300 mb-4 font-semibold">Inventory Overview</h3>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-[#112345] text-gray-300">
                  <th className="py-2 px-4 rounded-l-lg">PID</th>
                  <th className="py-2 px-4">Product</th>
                  <th className="py-2 px-4 rounded-r-lg">Stock status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: "M01AB", name: "Pain Relief Tablets", status: "Available" },
                  { id: "M01AE", name: "Anti-inflammatory Syrup", status: "Out of Stock" },
                  { id: "N02BA", name: "Headache Capsules", status: "Available" },
                  { id: "N02BE", name: "Fever Reducer", status: "Available" },
                  { id: "N05B", name: "Sleep Aid", status: "Out of Stock" },
                ].map((item, idx) => (
                  <tr
                    key={idx}
                    className="bg-[#14294d] hover:bg-[#1c3560] transition rounded-lg"
                  >
                    <td className="py-2 px-4">{item.id}</td>
                    <td className="py-2 px-4">{item.name}</td>
                    <td className="py-2 px-4">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                          item.status === "Available"
                            ? "bg-green-900 text-green-300 border border-green-500"
                            : "bg-red-900 text-red-300 border border-red-500"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
