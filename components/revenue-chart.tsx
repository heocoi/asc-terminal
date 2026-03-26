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
  "#00ff88", "#00d4ff", "#ffaa00", "#ff3355", "#aa77ff",
  "#ff6b9d", "#00e5a0", "#ff8844", "#44ccff", "#88ff44",
];

export function RevenueChart({ data }: { data: DailySales[] }) {
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
      entry[id] = +(day.apps[id]?.proceeds ?? 0).toFixed(2);
    }
    return entry;
  });

  const sortedApps = [...appIds].sort((a, b) => {
    const totalA = data.reduce((sum, d) => sum + (d.apps[a]?.proceeds ?? 0), 0);
    const totalB = data.reduce((sum, d) => sum + (d.apps[b]?.proceeds ?? 0), 0);
    return totalB - totalA;
  });

  return (
    <div className="border border-term-border">
      <div className="flex items-center justify-between border-b border-term-border px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-widest text-term-dim">Revenue</span>
        <span className="text-[10px] text-term-dim">30D</span>
      </div>
      <div className="px-1 py-2">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData}>
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
              tickFormatter={(v) => `$${v}`}
              domain={[0, "auto"]}
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
                fillOpacity={0.15}
                strokeWidth={1.5}
                name={id}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0 border-t border-term-border px-3 py-1.5">
        {sortedApps.slice(0, 6).map((id, i) => (
          <span key={id} className="flex items-center gap-1 text-[10px] text-term-dim">
            <span
              className="inline-block h-1.5 w-1.5"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {appNames[id]}
          </span>
        ))}
      </div>
    </div>
  );
}
