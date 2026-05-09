import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { superLogin } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const payload = await superLogin({ email, password });
      setSession(payload);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold">SGS Portal</h1>
        <p className="mt-2 text-sm text-purple-700">Super Admin Login</p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div>
            <label className="mb-1 block text-sm">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" />
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <button disabled={busy} className="w-full rounded bg-purple-700 px-4 py-2 font-semibold text-white hover:bg-purple-800">
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
