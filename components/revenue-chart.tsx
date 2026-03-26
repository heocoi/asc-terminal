"use client";

import {
  AreaChart,
  Area,
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

export function RevenueChart({ data }: { data: DailySales[] }) {
  // Collect all app IDs across all days
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
      date: day.date.slice(5), // MM-DD
    };
    for (const id of appIds) {
      entry[id] = day.apps[id]?.proceeds ?? 0;
    }
    return entry;
  });

  const sortedApps = [...appIds].sort((a, b) => {
    const totalA = data.reduce((sum, d) => sum + (d.apps[a]?.proceeds ?? 0), 0);
    const totalB = data.reduce((sum, d) => sum + (d.apps[b]?.proceeds ?? 0), 0);
    return totalB - totalA;
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">
        Revenue (Developer Proceeds)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <XAxis
            dataKey="date"
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#71717a"
            fontSize={12}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value, name) => [
              `$${Number(value).toFixed(2)}`,
              appNames[String(name)] || String(name),
            ]}
          />
          {sortedApps.map((id, i) => (
            <Area
              key={id}
              type="monotone"
              dataKey={id}
              stackId="1"
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.3}
              name={id}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      {sortedApps.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
          {sortedApps.slice(0, 8).map((id, i) => (
            <span key={id} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              {appNames[id]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
