const map = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-200 text-slate-700"
};

export default function StatusPill({ status }) {
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${map[status] || "bg-slate-200"}`}>{status}</span>;
}
