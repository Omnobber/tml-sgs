import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import SidebarLayout from "./components/SidebarLayout";

import LoginPage from "./pages/auth/LoginPage";
import SuperAdminLoginPage from "./pages/auth/SuperAdminLoginPage";

import ErcDashboard from "./pages/erc/DashboardPage";
import ErcCalls from "./pages/erc/CallsPage";
import ErcReports from "./pages/erc/ReportsPage";
import ErcUsers from "./pages/erc/UsersPage";

import FmsDashboard from "./pages/fms/DashboardPage";
import FmsCalls from "./pages/fms/CallsPage";
import FmsReports from "./pages/fms/ReportsPage";
import FmsUsers from "./pages/fms/UsersPage";

import AdminDashboard from "./pages/admin/DashboardPage";
import AdminCalls from "./pages/admin/CallsPage";
import AdminReports from "./pages/admin/ReportsPage";
import AdminUsers from "./pages/admin/UsersPage";

function ModuleShell({ children }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/super-login" element={<SuperAdminLoginPage />} />

      <Route path="/erc/dashboard" element={<ProtectedRoute allowedModules={["sgs-erc", "super"]}><ModuleShell><ErcDashboard /></ModuleShell></ProtectedRoute>} />
      <Route path="/erc/calls" element={<ProtectedRoute allowedModules={["sgs-erc", "super"]}><ModuleShell><ErcCalls /></ModuleShell></ProtectedRoute>} />
      <Route path="/erc/reports" element={<ProtectedRoute allowedModules={["sgs-erc", "super"]} allowedRoles={["admin", "engineer", "super_admin"]}><ModuleShell><ErcReports /></ModuleShell></ProtectedRoute>} />
      <Route path="/erc/users" element={<ProtectedRoute allowedModules={["sgs-erc", "super"]} allowedRoles={["admin", "super_admin"]}><ModuleShell><ErcUsers /></ModuleShell></ProtectedRoute>} />

      <Route path="/fms/dashboard" element={<ProtectedRoute allowedModules={["sgs-fms", "super"]}><ModuleShell><FmsDashboard /></ModuleShell></ProtectedRoute>} />
      <Route path="/fms/calls" element={<ProtectedRoute allowedModules={["sgs-fms", "super"]}><ModuleShell><FmsCalls /></ModuleShell></ProtectedRoute>} />
      <Route path="/fms/reports" element={<ProtectedRoute allowedModules={["sgs-fms", "super"]} allowedRoles={["admin", "engineer", "super_admin"]}><ModuleShell><FmsReports /></ModuleShell></ProtectedRoute>} />
      <Route path="/fms/users" element={<ProtectedRoute allowedModules={["sgs-fms", "super"]} allowedRoles={["admin", "super_admin"]}><ModuleShell><FmsUsers /></ModuleShell></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute allowedModules={["super"]} allowedRoles={["super_admin"]}><ModuleShell><AdminDashboard /></ModuleShell></ProtectedRoute>} />
      <Route path="/admin/calls" element={<ProtectedRoute allowedModules={["super"]}><ModuleShell><AdminCalls /></ModuleShell></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedModules={["super"]}><ModuleShell><AdminReports /></ModuleShell></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedModules={["super"]}><ModuleShell><AdminUsers /></ModuleShell></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
