import { useEffect, useState } from "react";
import { fetchSummary, fetchNotifications, markNotificationRead } from "../../api/moduleApi";

export default function ModuleDashboardPage({ moduleName, title }) {
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [sum, notes] = await Promise.all([fetchSummary(moduleName), fetchNotifications(moduleName)]);
      setSummary(sum.summary);
      setNotifications(notes);
    };

    load().catch(() => {});
  }, [moduleName]);

  const mark = async (id) => {
    await markNotificationRead(moduleName, id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">{title} Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card"><div className="text-sm text-slate-500">Total Calls</div><div className="mt-2 text-3xl font-bold">{summary?.total_calls ?? 0}</div></div>
        <div className="card"><div className="text-sm text-slate-500">Open Calls</div><div className="mt-2 text-3xl font-bold">{summary?.open_calls ?? 0}</div></div>
        <div className="card"><div className="text-sm text-slate-500">Closed Calls</div><div className="mt-2 text-3xl font-bold">{summary?.closed_calls ?? 0}</div></div>
        <div className="card"><div className="text-sm text-slate-500">Avg Resolution (hrs)</div><div className="mt-2 text-3xl font-bold">{summary?.avg_resolution_hours ?? 0}</div></div>
      </div>

      <div className="card">
        <h3 className="mb-3 text-lg font-semibold">Notifications</h3>
        <div className="space-y-2">
          {notifications.length === 0 ? <div className="text-sm text-slate-500">No notifications</div> : null}
          {notifications.map((n) => (
            <div key={n.id} className="flex items-center justify-between rounded border border-slate-200 p-2">
              <div className={n.is_read ? "text-slate-500" : "font-medium"}>{n.message}</div>
              {!n.is_read ? (
                <button className="rounded bg-slate-900 px-2 py-1 text-xs text-white" onClick={() => mark(n.id)}>
                  Mark read
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
