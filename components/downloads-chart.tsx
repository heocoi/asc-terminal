"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailySales } from "@/lib/types";

const COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16",
];

export function DownloadsChart({ data }: { data: DailySales[] }) {
  const appIds = new Set<string>();
  const appNames: Record<string, string> = {};
  for (const day of data) {
    for (const [id, info] of Object.entries(day.apps)) {
      appIds.add(id);
      appNames[id] = info.title;
    }
  }

  const chartData = data.map((day) => {
    const entry: Record<string, string | number> = {
      date: day.date.slice(5),
    };
    for (const id of appIds) {
      entry[id] = day.apps[id]?.downloads ?? 0;
    }
    return entry;
  });

  const sortedApps = [...appIds].sort((a, b) => {
    const totalA = data.reduce((sum, d) => sum + (d.apps[a]?.downloads ?? 0), 0);
    const totalB = data.reduce((sum, d) => sum + (d.apps[b]?.downloads ?? 0), 0);
    return totalB - totalA;
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Downloads</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis
            dataKey="date"
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
          />
          <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value, name) => [
              String(value),
              appNames[String(name)] || String(name),
            ]}
          />
          {sortedApps.map((id, i) => (
            <Bar
              key={id}
              dataKey={id}
              stackId="1"
              fill={COLORS[i % COLORS.length]}
              name={id}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
