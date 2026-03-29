"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { DailySales } from "@/lib/types";

const CHART_COLORS = [
  "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899",
];
const OTHER_COLOR = "#D4CFC8";

type Metric = "revenue" | "downloads" | "subscriptions";

function CustomTooltip({ active, payload, label, metric }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  metric: Metric;
}) {
  if (!active || !payload?.length) return null;
  const filtered = payload.filter(e => Number(e.value) > 0);
  if (filtered.length === 0) return null;

  const total = filtered.reduce((s, e) => s + Number(e.value), 0);

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5 shadow-sm">
      <p className="mb-1.5 text-[10px] font-semibold text-text-muted">{label}</p>
      {filtered.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs leading-5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="flex-1 truncate text-text-secondary" style={{ maxWidth: 140 }}>
            {entry.name}
          </span>
          <span className="font-mono font-semibold tabular-nums text-text-primary">
            {(metric === "revenue" || metric === "subscriptions") ? `$${Number(entry.value).toFixed(2)}` : entry.value}
          </span>
        </div>
      ))}
      {filtered.length > 1 && (
        <div className="mt-1.5 flex items-center justify-between border-t border-border pt-1.5 text-xs">
          <span className="font-medium text-text-tertiary">Total</span>
          <span className="font-mono font-bold tabular-nums text-text-primary">
            {(metric === "revenue" || metric === "subscriptions") ? `$${total.toFixed(2)}` : total}
          </span>
        </div>
      )}
    </div>
  );
}

export function TrendChart({ data }: { data: DailySales[] }) {
  const [metric, setMetric] = useState<Metric>("revenue");

  // Check if any subscription revenue exists
  const hasSubRevenue = data.some(d =>
    Object.values(d.apps).some(app => app.subscriptionRevenue > 0)
  );

  // Collect all apps
  const appIds = new Set<string>();
  const appNames: Record<string, string> = {};
  for (const day of data) {
    for (const [id, info] of Object.entries(day.apps)) {
      appIds.add(id);
      appNames[id] = info.title;
    }
  }

  // Sort by total, pick top 5, group rest as "Other"
  const getMetricValue = (app: DailySales["apps"][string] | undefined): number => {
    if (!app) return 0;
    if (metric === "revenue") return app.proceeds;
    if (metric === "subscriptions") return app.subscriptionRevenue;
    return app.downloads;
  };

  const sorted = [...appIds].sort((a, b) => {
    const valA = data.reduce((sum, d) => sum + getMetricValue(d.apps[a]), 0);
    const valB = data.reduce((sum, d) => sum + getMetricValue(d.apps[b]), 0);
    return valB - valA;
  });

  // For subscriptions, filter out apps with no sub revenue
  const filteredSorted = metric === "subscriptions"
    ? sorted.filter(id => data.some(d => (d.apps[id]?.subscriptionRevenue ?? 0) > 0))
    : sorted;

  const top5 = filteredSorted.slice(0, 5);
  const rest = filteredSorted.slice(5);
  const hasOther = rest.length > 0;

  const isMoney = metric === "revenue" || metric === "subscriptions";

  const chartData = data.map((day) => {
    const entry: Record<string, string | number> = { date: day.date.slice(5) };
    for (const id of top5) {
      const val = getMetricValue(day.apps[id]);
      entry[id] = isMoney ? +val.toFixed(2) : val;
    }
    if (hasOther) {
      entry["__other"] = rest.reduce((s, id) => s + getMetricValue(day.apps[id]), 0);
      if (isMoney) entry["__other"] = +Number(entry["__other"]).toFixed(2);
    }
    return entry;
  });

  const allKeys = [...top5, ...(hasOther ? ["__other"] : [])];

  return (
    <div className="card animate-fade-up rounded-xl" style={{ animationDelay: "0.18s" }}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex gap-0.5 rounded-lg bg-surface-inset p-0.5">
          {(["revenue", "downloads", ...(hasSubRevenue ? ["subscriptions" as const] : [])] as Metric[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition-all ${
                metric === m
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          {isMoney ? (
            <AreaChart data={chartData}>
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
                tickFormatter={(v) => v >= 0 ? `$${v}` : ""}
                domain={[0, "dataMax"]}
                allowDecimals={false}
                width={45}
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />
              {allKeys.map((id, i) => (
                <Area
                  key={id}
                  type="monotone"
                  dataKey={id}
                  stackId="1"
                  stroke={id === "__other" ? OTHER_COLOR : CHART_COLORS[i % CHART_COLORS.length]}
                  fill={id === "__other" ? OTHER_COLOR : CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={id === "__other" ? 0.15 : 0.08}
                  strokeWidth={id === "__other" ? 1 : 1.5}
                  name={id === "__other" ? `Other (${rest.length})` : (appNames[id] || id)}
                />
              ))}
            </AreaChart>
          ) : (
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
                allowDecimals={false}
                width={35}
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />
              {allKeys.map((id, i) => (
                <Bar
                  key={id}
                  dataKey={id}
                  stackId="1"
                  fill={id === "__other" ? OTHER_COLOR : CHART_COLORS[i % CHART_COLORS.length]}
                  opacity={id === "__other" ? 0.5 : 0.75}
                  name={id === "__other" ? `Other (${rest.length})` : (appNames[id] || id)}
                  radius={i === allKeys.length - 1 ? [2, 2, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend - hide for single app */}
      {allKeys.length > 1 && <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-5 py-3">
        {allKeys.map((id, i) => (
          <span key={id} className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: id === "__other" ? OTHER_COLOR : CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {id === "__other" ? `Other (${rest.length})` : appNames[id]}
          </span>
        ))}
      </div>}
    </div>
  );
}
