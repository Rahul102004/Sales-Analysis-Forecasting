import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Layout";

// pages
import SalesOverview from "./pages/SalesOverview";
import SalesAnalytics from "./pages/SalesAnalytics";
import InventoryManagement from "./pages/InventoryManagement";
import ChatWithRia from "./pages/ChatWithRia";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Wrap all routes with Layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/sales-overview" replace />} />
          <Route path="sales-overview" element={<SalesOverview />} />
          <Route path="sales-analytics" element={<SalesAnalytics />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="chat" element={<ChatWithRia />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
