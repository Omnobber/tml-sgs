import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ children, allowedModules = [], allowedRoles = [] }) {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedModules.length && !allowedModules.includes(user.module)) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
