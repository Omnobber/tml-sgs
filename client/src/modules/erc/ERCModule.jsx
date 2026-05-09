import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import AdminDashboard from "./pages/AdminDashboard";
import EngineerDashboard from "./pages/EngineerDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import CallManagementPage from "./pages/CallManagementPage";
import ReportsPage from "./pages/ReportsPage";
import InventoryPage from "./pages/InventoryPage";
import "./erc.css";

export default function ERCModule() {
  const role = useAuthStore((s) => s.user?.role || "client");
  const location = useLocation();

  const view = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes("/inventory")) return "inventory";
    if (path.includes("/reports")) return "reports";
    if (path.includes("/calls")) return "calls";
    return "dashboard";
  }, [location.pathname]);

  let content = null;
  if (view === "dashboard") {
    if (role === "admin") content = <AdminDashboard />;
    else if (role === "engineer") content = <EngineerDashboard />;
    else content = <ClientDashboard />;
  } else if (view === "calls") {
    if (role === "admin") content = <CallManagementPage />;
    else if (role === "engineer") content = <EngineerDashboard />;
    else content = <ClientDashboard />;
  } else if (view === "reports") {
    if (role === "admin" || role === "engineer") content = <ReportsPage />;
    else content = <ClientDashboard />;
  } else if (view === "inventory") {
    content = role === "admin" ? <InventoryPage /> : <ClientDashboard />;
  }

  return (
    <div className="erc-module">
      <Toaster position="top-right" />
      {content}
    </div>
  );
}
