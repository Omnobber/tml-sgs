import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { fetchSummary } from "../../api/moduleApi";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";

const chartColors = ["#0A3D91", "#0B6E4F", "#6D2E9B", "#AA3A2A"];

function exportCSV(rows) {
  const header = "type,value\n";
  const lines = rows.map((row) => `${row.priority || row.month},${row.count}`).join("\n");
  const blob = new Blob([header + lines], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "report.csv";
  link.click();
}

function exportExcel(rows) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Priority");
  XLSX.writeFile(wb, "report.xlsx");
}

function exportPDF(title, summary, byPriority) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`${title} Report`, 14, 18);
  doc.setFontSize(11);
  doc.text(`Total Calls: ${summary.total_calls || 0}`, 14, 30);
  doc.text(`Open Calls: ${summary.open_calls || 0}`, 14, 38);
  doc.text(`Closed Calls: ${summary.closed_calls || 0}`, 14, 46);
  doc.text(`Avg Resolution Hours: ${summary.avg_resolution_hours || 0}`, 14, 54);

  doc.text("Priority Breakdown:", 14, 66);
  byPriority.forEach((item, idx) => {
    doc.text(`${item.priority}: ${item.count}`, 20, 74 + idx * 8);
  });

  doc.save("report.pdf");
}

export default function ModuleReportsPage({ moduleName, title }) {
  const [data, setData] = useState({ summary: {}, byPriority: [], monthlyTrend: [] });

  useEffect(() => {
    fetchSummary(moduleName).then(setData).catch(() => {});
  }, [moduleName]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title} Reports & Analytics</h2>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(data.byPriority)} className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">CSV</button>
          <button onClick={() => exportExcel(data.byPriority)} className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Excel</button>
          <button onClick={() => exportPDF(title, data.summary || {}, data.byPriority || [])} className="rounded bg-slate-900 px-3 py-2 text-sm font-semibold text-white">PDF</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card h-80">
          <h3 className="mb-3 text-lg font-semibold">Monthly Call Volume</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data.monthlyTrend}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0A3D91" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card h-80">
          <h3 className="mb-3 text-lg font-semibold">Priority Breakdown</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={data.byPriority} dataKey="count" nameKey="priority" outerRadius={90} label>
                {data.byPriority.map((entry, index) => <Cell key={entry.priority} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
