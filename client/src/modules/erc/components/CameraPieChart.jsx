import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const PRIMARY_DARK = "#1E293B";
const CHART_MARGIN = { top: 22, right: 24, bottom: 22, left: 24 };

const CameraPieChart = ({ active, faulty, maintenance }) => {
  const data = [
    { name: "Active", value: active, color: "#1a8f5d" },
    { name: "Faulty", value: faulty, color: "#d9471a" },
    { name: "Maintenance", value: maintenance, color: "#d6a300" }
  ];

  return (
    <div className="h-[430px] w-full overflow-visible rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
      <h3 className="font-heading text-lg font-semibold text-[#1E293B]">Camera Status Overview</h3>
      <div className="flex h-[360px] flex-col">
        <div className="mx-auto mt-2 h-[300px] w-full max-w-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={CHART_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
              <Tooltip
                contentStyle={{ borderColor: "#CBD5E1", borderRadius: "0.75rem", backgroundColor: "#FFFFFF" }}
                labelStyle={{ color: PRIMARY_DARK, fontWeight: 700 }}
                itemStyle={{ color: PRIMARY_DARK, fontWeight: 600 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-end pr-4 pb-1">
          <div className="space-y-2 text-sm font-medium text-[#1E293B]">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraPieChart;
