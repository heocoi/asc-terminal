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
  "#00ff88", "#00d4ff", "#ffaa00", "#ff3355", "#aa77ff",
  "#ff6b9d", "#00e5a0", "#ff8844", "#44ccff", "#88ff44",
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
    const entry: Record<string, string | number> = { date: day.date.slice(5) };
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
    <div className="border border-term-border">
      <div className="flex items-center justify-between border-b border-term-border px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-widest text-term-dim">Downloads</span>
        <span className="text-[10px] text-term-dim">30D</span>
      </div>
      <div className="px-1 py-2">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="date"
              stroke="#2a2a2a"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#1a1a1a" }}
              tick={{ fill: "#555" }}
            />
            <YAxis
              stroke="#2a2a2a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#555" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#111",
                border: "1px solid #2a2a2a",
                borderRadius: 0,
                fontSize: "11px",
                fontFamily: "JetBrains Mono, monospace",
                padding: "6px 10px",
              }}
              itemStyle={{ padding: 0, margin: 0 }}
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
                opacity={0.85}
                name={id}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
