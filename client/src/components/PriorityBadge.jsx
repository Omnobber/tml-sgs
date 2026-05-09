const map = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800"
};

export default function PriorityBadge({ value }) {
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${map[value] || "bg-slate-200 text-slate-700"}`}>{value}</span>;
}
