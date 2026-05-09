import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function PortalLandingPage() {
  const navigate = useNavigate();
  const setSelection = useAuthStore((s) => s.setSelection);

  const choose = (module) => {
    setSelection({ module, role: "" });
    navigate(`/login?module=${module}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-4xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-4xl font-bold text-slate-900">SGS Portal</h1>
        <p className="mt-3 text-slate-600">Unified Call Management System</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            onClick={() => choose("sgs-erc")}
            className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-left hover:bg-blue-100"
          >
            <div className="text-lg font-semibold text-blue-900">Login to TML-SGS-ERC</div>
            <div className="mt-2 text-sm text-blue-700">Industrial incident and equipment support management</div>
          </button>

          <button
            onClick={() => choose("sgs-fms")}
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-left hover:bg-emerald-100"
          >
            <div className="text-lg font-semibold text-emerald-900">Login to TML SGS FMS</div>
            <div className="mt-2 text-sm text-emerald-700">Fleet maintenance and service request operations</div>
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={() => navigate("/super-login")}
            className="rounded bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800"
          >
            Super Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}
