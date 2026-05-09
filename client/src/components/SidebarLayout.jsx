import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { moduleTheme } from "../utils/moduleTheme";
import { logout } from "../api/authApi";

export default function SidebarLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshToken, clearSession } = useAuthStore();

  const theme = moduleTheme[user?.module || "super"];
  const base = user?.module === "sgs-erc" ? "/erc" : user?.module === "sgs-fms" ? "/fms" : "/admin";

  const isFms = user?.module === "sgs-fms";
  const links = isFms
    ? [{ to: `${base}/calls`, label: "Call Logs" }]
    : [
        { to: `${base}/dashboard`, label: "Dashboard" },
        { to: `${base}/calls`, label: "Call Logs" },
        { to: `${base}/reports`, label: "Reports" }
      ];

  if (!isFms && (user?.role === "admin" || user?.role === "super_admin")) {
    links.push({ to: `${base}/users`, label: "Users" });
  }

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logout(refreshToken);
      }
    } finally {
      clearSession();
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-72 p-4 text-white" style={{ backgroundColor: theme.color }}>
        <h1 className="text-2xl font-bold">SGS Portal</h1>
        <p className="mt-2 text-sm opacity-90">{theme.title}</p>
        <div className="mt-6 rounded-md bg-white/10 p-3 text-sm">
          <div>{user?.name}</div>
          <div className="uppercase tracking-wide opacity-90">{user?.role}</div>
        </div>
        <nav className="mt-6 space-y-2">
          {links.map((link) => {
            const active = location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`block rounded px-3 py-2 ${active ? "bg-white text-slate-900" : "bg-white/10 hover:bg-white/20"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 w-full rounded bg-black/20 px-3 py-2 text-left hover:bg-black/30"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
