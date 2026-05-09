import { useEffect, useState } from "react";
import { fetchSuperSummary } from "../../api/moduleApi";

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchSuperSummary().then(setData).catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">Super Admin Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card"><div className="text-sm text-slate-500">Combined Total Calls</div><div className="mt-2 text-3xl font-bold">{data?.totals?.totalCalls ?? 0}</div></div>
        <div className="card"><div className="text-sm text-slate-500">Combined Open Calls</div><div className="mt-2 text-3xl font-bold">{data?.totals?.openCalls ?? 0}</div></div>
        <div className="card"><div className="text-sm text-slate-500">Combined Closed Calls</div><div className="mt-2 text-3xl font-bold">{data?.totals?.closedCalls ?? 0}</div></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold">ERC Summary</h3>
          <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-xs">{JSON.stringify(data?.erc?.summary || {}, null, 2)}</pre>
        </div>
        <div className="card">
          <h3 className="mb-2 text-lg font-semibold">FMS Summary</h3>
          <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-xs">{JSON.stringify(data?.fms?.summary || {}, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
