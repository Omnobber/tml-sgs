import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const roleOptions = [
  { key: "admin", label: "Admin Login" },
  { key: "engineer", label: "Engineer Login" },
  { key: "client", label: "Client Login" }
];

export default function RoleSelectPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const moduleName = params.get("module") || "";
  const setSelection = useAuthStore((s) => s.setSelection);

  const label = useMemo(() => {
    if (moduleName === "sgs-erc") return "TML-SGS-ERC";
    if (moduleName === "sgs-fms") return "TML SGS FMS";
    return "SGS Module";
  }, [moduleName]);

  const pick = (role) => {
    setSelection({ module: moduleName, role });
    navigate(`/login?module=${moduleName}&role=${role}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold">SGS Portal</h1>
        <p className="mt-2 text-slate-600">Select role for {label}</p>
        <div className="mt-6 grid gap-3">
          {roleOptions.map((role) => (
            <button
              key={role.key}
              onClick={() => pick(role.key)}
              className="rounded border border-slate-300 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
            >
              {role.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
