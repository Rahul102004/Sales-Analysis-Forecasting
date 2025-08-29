import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BarChart2, Boxes, Bot } from "lucide-react";

export default function Layout() {
  const location = useLocation();

  // Sidebar menu items
  const menuItems = [
    { name: "Sales Overview", path: "/", icon: LayoutDashboard },
    { name: "Sales Analytics", path: "/sales-analytics", icon: BarChart2 },
    { name: "Inventory Management", path: "/inventory", icon: Boxes },
    { name: "Chat With ‘Ria’", path: "/chat", icon: Bot },
  ];

  return (
    <div className="flex min-h-screen bg-[#0B1730] text-white">
      {/* Sidebar */}
      <aside className="w-74 bg-[#0F1E40] p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-8">Pharmalytics</h1>

        <nav className="flex flex-col space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-gray-800 border-l-4 border-cyan-400"
                    : "hover:bg-gray-700"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-[#0B1730] px-6 pt-6">
        <Outlet />
      </main>
    </div>
  );
}
