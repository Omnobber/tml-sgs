import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { login } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";

export default function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const queryModule = params.get("module") || "";
  const queryRole = params.get("role") || "";

  const [moduleName, setModuleName] = useState(queryModule || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (queryModule) setModuleName(queryModule);
  }, [queryModule]);

  const departmentOptions = useMemo(
    () => [
      { value: "sgs-erc", label: "TML-SGS-ERC" },
      { value: "sgs-fms", label: "TML-SGS-FMS" }
    ],
    []
  );

  const routeAfterLogin = (module, role) => {
    if (module === "sgs-erc") {
      if (role === "admin" || role === "engineer" || role === "client") return "/erc/dashboard";
      return "/erc/dashboard";
    }
    return "/fms/calls";
  };

  const tryRolesInOrder = (preferredRole) => {
    const all = ["admin", "engineer", "client"];
    if (!preferredRole || !all.includes(preferredRole)) return all;
    return [preferredRole, ...all.filter((r) => r !== preferredRole)];
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    if (!moduleName) {
      setError("Please select department");
      setBusy(false);
      return;
    }

    try {
      const roles = tryRolesInOrder(queryRole);
      let payload = null;
      let finalError = null;

      for (const role of roles) {
        try {
          payload = await login({ module: moduleName, role, email: email.trim(), password });
          break;
        } catch (err) {
          finalError = err;
          if (err?.response?.status !== 401) break;
        }
      }

      if (!payload) throw finalError || new Error("Login failed");
      setSession(payload);
      navigate(routeAfterLogin(payload.user?.module, payload.user?.role));
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(130deg,#ffffff_0%,#dff7ea_45%,#0f0f0f_100%)] p-4 sm:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">
          <section className="hidden bg-[linear-gradient(145deg,#0a0a0a_0%,#0f5f36_60%,#1a7f4a_100%)] p-10 text-white md:block">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/90">SGS Portal</p>
            <p className="mt-5 max-w-sm text-lg font-semibold text-white/95">
              One secure login for ERC and FMS operations.
            </p>
            <div className="mt-8 space-y-3 text-sm font-semibold text-white/90">
              <p>Department-based access</p>
              <p>Auto role routing for Admin / Engineer / Client</p>
              <p>Unified authentication flow</p>
            </div>
          </section>

          <section className="p-6 sm:p-8 md:p-10">
            <div className="md:hidden">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">SGS Portal</p>
            </div>

            <h2 className="hidden text-4xl font-bold text-slate-900 md:block">Sign In</h2>
            <p className="mt-3 text-sm font-semibold text-slate-700 sm:text-base">Select your department and sign in</p>

            <form className="mt-7 space-y-5" onSubmit={submit}>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 pr-20 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Seed format:{" "}
                <span className="font-semibold">
                  {moduleName === "sgs-fms" ? "fms.admin@sgs.local" : "erc.admin@sgs.local"}
                </span>{" "}
                / Password@123
              </div>

              <button
                disabled={busy}
                className="w-full rounded-xl bg-[linear-gradient(120deg,#0b0b0b_0%,#11834a_50%,#0b0b0b_100%)] px-4 py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-70"
              >
                {busy ? "Signing in..." : "Sign In ->"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
