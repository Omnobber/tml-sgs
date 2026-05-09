import { useEffect, useMemo, useState } from "react";
import { createCall, fetchCalls, updateCall } from "../../api/moduleApi";
import { useAuthStore } from "../../store/authStore";
import PriorityBadge from "../../components/PriorityBadge";
import StatusPill from "../../components/StatusPill";

const statuses = ["open", "in_progress", "resolved", "closed"];
const priorities = ["low", "medium", "high", "critical"];

export default function ModuleCallsPage({ moduleName, title }) {
  const user = useAuthStore((s) => s.user);
  const [calls, setCalls] = useState([]);
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({ status: "", priority: "", assignedTo: "" });

  const [form, setForm] = useState({
    callerName: "",
    contact: "",
    location: "",
    issueType: "",
    priority: "medium",
    description: "",
    vehicleNumber: "",
    severity: ""
  });

  const canCreate = useMemo(() => ["admin", "engineer", "super_admin"].includes(user?.role), [user]);

  const load = async () => {
    setBusy(true);
    try {
      const data = await fetchCalls(moduleName, filters);
      setCalls(data);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [moduleName]);

  const submitCall = async (e) => {
    e.preventDefault();
    await createCall(moduleName, form);
    setForm({ callerName: "", contact: "", location: "", issueType: "", priority: "medium", description: "", vehicleNumber: "", severity: "" });
    await load();
  };

  const setStatus = async (callId, status) => {
    await updateCall(moduleName, callId, { status, comment: `Status updated to ${status}` });
    await load();
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">{title} Call Logs</h2>

      {canCreate ? (
        <form onSubmit={submitCall} className="card grid gap-3 md:grid-cols-2">
          <input className="rounded border px-3 py-2" placeholder="Caller Name" value={form.callerName} onChange={(e) => setForm({ ...form, callerName: e.target.value })} required />
          <input className="rounded border px-3 py-2" placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} required />
          <input className="rounded border px-3 py-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          <input className="rounded border px-3 py-2" placeholder="Issue Type" value={form.issueType} onChange={(e) => setForm({ ...form, issueType: e.target.value })} required />
          {moduleName === "fms" ? <input className="rounded border px-3 py-2" placeholder="Vehicle Number" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} /> : null}
          {moduleName === "fms" ? <input className="rounded border px-3 py-2" placeholder="Severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} /> : null}
          <select className="rounded border px-3 py-2" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <textarea className="rounded border px-3 py-2 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <div className="md:col-span-2">
            <button className="rounded bg-slate-900 px-4 py-2 font-semibold text-white">Create Call</button>
          </div>
        </form>
      ) : null}

      <div className="card space-y-3">
        <div className="flex flex-wrap gap-3">
          <select className="rounded border px-3 py-2" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Status</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select className="rounded border px-3 py-2" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
            <option value="">All Priority</option>
            {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
          <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={() => load()}>Apply Filters</button>
        </div>

        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Ref No</th>
                <th>Caller</th>
                {moduleName === "fms" ? <th>Vehicle</th> : null}
                <th>Issue</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr key={call.id}>
                  <td className="font-medium">{call.reference_no}</td>
                  <td>{call.caller_name}</td>
                  {moduleName === "fms" ? <td>{call.vehicle_number || "-"}</td> : null}
                  <td>{call.issue_type}</td>
                  <td><PriorityBadge value={call.priority} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <StatusPill status={call.status} />
                      <select className="rounded border px-2 py-1 text-xs" value={call.status} onChange={(e) => setStatus(call.id, e.target.value)}>
                        {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>
                  </td>
                  <td>{call.assigned_to_name || "Unassigned"}</td>
                  <td>{new Date(call.updated_at).toLocaleString()}</td>
                </tr>
              ))}
              {!busy && calls.length === 0 ? <tr><td colSpan={moduleName === "fms" ? 8 : 7} className="py-6 text-center text-slate-500">No call records</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
