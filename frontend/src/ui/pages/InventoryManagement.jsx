import React, { useEffect, useMemo, useState } from "react";
import { Edit, Trash, X } from "lucide-react";

const API = "http://localhost:5000/api/inventory";

function fmt(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

export default function InventoryManagement() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({
    totalStocks: 0,
    productTypesCount: 0,
    oldestStockDate: null,
    latestStockDate: null,
  });
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", quantity: 0, status: "High" });
  const [isEditing, setIsEditing] = useState(false);

  async function loadAll() {
    const [a, b] = await Promise.all([
      fetch(API).then((r) => r.json()),
      fetch(`${API}/stats`).then((r) => r.json()),
    ]);
    setRows(a);
    setStats(b);
  }

  useEffect(() => {
    loadAll().catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        (r.name || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  function openAdd() {
    setIsEditing(false);
    setForm({ id: "", name: "", quantity: 0, status: "High" });
    setModalOpen(true);
  }

  function openEdit(r) {
    setIsEditing(true);
    setForm({
      id: r.id,
      name: r.name,
      quantity: r.quantity,
      status: r.status,
    });
    setModalOpen(true);
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    await loadAll();
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (isEditing) {
      // PUT (id stays same; lastUpdated auto-bumps in backend)
      await fetch(`${API}/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          quantity: Number(form.quantity),
          status: form.status,
        }),
      });
    } else {
      // POST
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          name: form.name,
          quantity: Number(form.quantity),
          status: form.status,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        alert(`Create failed: ${t}`);
      }
    }
    setModalOpen(false);
    await loadAll();
  }

  return (
    <div className="p-6 text-white space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <span className="text-sm text-gray-400">Jana Dzousa | Sales Manager</span>
      </div>

      {/* Search */}
      <div className="flex">
        <input
          type="text"
          placeholder="Search by Product ID or Name..."
          className="w-full bg-[#0b1c3a] border border-gray-700 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0b1c3a] p-4 rounded-xl">
          <p className="text-gray-400">Total Stocks</p>
          <h3 className="text-2xl font-bold">
            {stats.totalStocks.toLocaleString()}{" "}
            <span className="ml-2 text-green-400 text-sm"></span>
          </h3>
        </div>
        <div className="bg-[#0b1c3a] p-4 rounded-xl">
          <p className="text-gray-400">Product Types count</p>
          <h3 className="text-2xl font-bold">{stats.productTypesCount}</h3>
        </div>
        <div className="bg-[#0b1c3a] p-4 rounded-xl">
          <p className="text-gray-400">Oldest Stock Date</p>
          <h3 className="text-xl font-semibold">{fmt(stats.oldestStockDate)}</h3>
        </div>
        <div className="bg-[#0b1c3a] p-4 rounded-xl">
          <p className="text-gray-400">Latest Stock Date</p>
          <h3 className="text-xl font-semibold">{fmt(stats.latestStockDate)}</h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0b1c3a] rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Product Details</h3>
          <button onClick={openAdd} className="bg-blue-600 px-4 py-2 rounded-lg">
            + Add Product
          </button>
        </div>
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-[#112345] text-gray-300">
              <th className="py-2 px-4">Product ID</th>
              <th className="py-2 px-4">Product Name</th>
              <th className="py-2 px-4">Quantity</th>
              <th className="py-2 px-4">Last Updated</th>
              <th className="py-2 px-4">Stock status</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((p) => (
                <tr key={p.id} className="bg-[#14294d] hover:bg-[#1c3560] transition rounded-lg">
                  <td className="py-2 px-4">{p.id}</td>
                  <td className="py-2 px-4">{p.name}</td>
                  <td className="py-2 px-4">{p.quantity}</td>
                  <td className="py-2 px-4">{fmt(p.lastUpdated)}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                        p.status === "High"
                          ? "bg-green-900 text-green-300 border border-green-500"
                          : p.status === "Medium"
                          ? "bg-yellow-900 text-yellow-300 border border-yellow-500"
                          : "bg-red-900 text-red-300 border border-red-500"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 flex gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="bg-blue-600 p-2 rounded-lg hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="bg-red-600 p-2 rounded-lg hover:bg-red-700"
                    >
                      <Trash className="w-4 h-4 text-white" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-400">
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0b1c3a] w-full max-w-lg rounded-2xl p-6 relative">
            <button
              className="absolute right-3 top-3 p-1 hover:bg-white/10 rounded-lg"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <h3 className="text-xl font-semibold mb-4">
              {isEditing ? "Edit Product" : "Add Product"}
            </h3>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-300 mb-1">Product ID</label>
                  <input
                    className="w-full bg-[#14294d] px-3 py-2 rounded-lg border border-gray-700"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    placeholder="e.g. N02BE"
                    required
                    disabled={isEditing}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-300 mb-1">Product Name</label>
                  <input
                    className="w-full bg-[#14294d] px-3 py-2 rounded-lg border border-gray-700"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Fever Reducer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    className="w-full bg-[#14294d] px-3 py-2 rounded-lg border border-gray-700"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Status</label>
                  <select
                    className="w-full bg-[#14294d] px-3 py-2 rounded-lg border border-gray-700"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-600"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700"
                >
                  {isEditing ? "Confirm" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
