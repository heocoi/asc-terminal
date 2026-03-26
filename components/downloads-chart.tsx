"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { DailySales } from "@/lib/types";

const CHART_COLORS = [
  "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899",
  "#8B5CF6", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const filtered = payload.filter(e => Number(e.value) > 0);
  if (filtered.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-sm">
      <p className="mb-1 text-[10px] font-semibold text-text-muted">{label}</p>
      {filtered.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="flex-1 truncate text-text-secondary" style={{ maxWidth: 120 }}>
            {entry.name}
          </span>
          <span className="font-mono font-semibold tabular-nums text-text-primary">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

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
    <div className="card animate-fade-up rounded-xl" style={{ animationDelay: "0.22s" }}>
      <div className="px-5 py-4">
        <h3 className="section-label">Downloads</h3>
      </div>
      <div className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="transparent"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#B0AAA2" }}
            />
            <YAxis
              stroke="transparent"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "#B0AAA2" }}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            {sortedApps.map((id, i) => (
              <Bar
                key={id}
                dataKey={id}
                stackId="1"
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                opacity={0.75}
                name={appNames[id] || id}
                radius={i === sortedApps.length - 1 ? [2, 2, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-5 py-3">
        {sortedApps.slice(0, 5).map((id, i) => (
          <span key={id} className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {appNames[id]}
          </span>
        ))}
      </div>
    </div>
  );
}
