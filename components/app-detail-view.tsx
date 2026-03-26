"use client";

import { useState } from "react";
import { TrendChart } from "@/components/trend-chart";
import { CountryBreakdown } from "@/components/country-breakdown";
import type { DailySales } from "@/lib/types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtShort(d: string) {
  const [, m, day] = d.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(day, 10)}`;
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const isUp = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
      isUp ? "text-positive-text" : "text-negative-text"
    }`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
        className={isUp ? "" : "rotate-180"}>
        <path d="M5 2L8.5 6.5H1.5L5 2Z" />
      </svg>
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

const PERIODS = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
] as const;

function getAppAlerts(sales: DailySales[], appId: string): string[] {
  const alerts: string[] = [];
  if (sales.length < 10) return alerts;

  const recent3 = sales.slice(-3);
  const prior7 = sales.slice(-10, -3);

  const recentRevAvg = recent3.reduce((s, d) => s + (d.apps[appId]?.proceeds ?? 0), 0) / 3;
  const priorRevAvg = prior7.reduce((s, d) => s + (d.apps[appId]?.proceeds ?? 0), 0) / 7;
  // Only alert if prior average >= $1/day (avoid noise from micro-revenue apps)
  if (priorRevAvg >= 1) {
    const dropPct = ((priorRevAvg - recentRevAvg) / priorRevAvg) * 100;
    if (dropPct > 40) alerts.push(`Revenue dropped ${dropPct.toFixed(0)}% vs prior week`);
    const spikePct = ((recentRevAvg - priorRevAvg) / priorRevAvg) * 100;
    if (spikePct > 100) alerts.push(`Revenue spiked +${spikePct.toFixed(0)}% vs prior week`);
  }

  const recentDlAvg = recent3.reduce((s, d) => s + (d.apps[appId]?.downloads ?? 0), 0) / 3;
  const priorDlAvg = prior7.reduce((s, d) => s + (d.apps[appId]?.downloads ?? 0), 0) / 7;
  // Only alert if prior average >= 3/day (avoid false positive for low-volume apps)
  if (priorDlAvg >= 3) {
    const dropPct = ((priorDlAvg - recentDlAvg) / priorDlAvg) * 100;
    if (dropPct > 40) alerts.push(`Downloads dropped ${dropPct.toFixed(0)}% vs prior week`);
    const spikePct = ((recentDlAvg - priorDlAvg) / priorDlAvg) * 100;
    if (spikePct > 100) alerts.push(`Downloads spiked +${spikePct.toFixed(0)}% vs prior week`);
  }

  return alerts;
}

export function AppDetailView({ allSales, appId }: { allSales: DailySales[]; appId: string }) {
  const [period, setPeriod] = useState<number>(30);

  // Slice data for selected period
  const currentSlice = allSales.slice(-period);
  const prevSlice = allSales.slice(0, -period);

  // Build single-app sales for chart
  const sales: DailySales[] = currentSlice.map((day) => ({
    date: day.date,
    apps: day.apps[appId] ? { [appId]: day.apps[appId] } : {},
    totalDownloads: day.apps[appId]?.downloads ?? 0,
    totalRevenue: day.apps[appId]?.revenue ?? 0,
    totalProceeds: day.apps[appId]?.proceeds ?? 0,
  }));

  const totalProceeds = currentSlice.reduce((s, d) => s + (d.apps[appId]?.proceeds ?? 0), 0);
  const totalDownloads = currentSlice.reduce((s, d) => s + (d.apps[appId]?.downloads ?? 0), 0);
  const prevProceeds = prevSlice.reduce((s, d) => s + (d.apps[appId]?.proceeds ?? 0), 0);
  const prevDownloads = prevSlice.reduce((s, d) => s + (d.apps[appId]?.downloads ?? 0), 0);

  const firstDate = currentSlice[0]?.date ?? "";
  const lastDate = currentSlice[currentSlice.length - 1]?.date ?? "";
  const dateRange = firstDate && lastDate ? `${fmtShort(firstDate)} - ${fmtShort(lastDate)}` : "";

  // Anomaly detection (always based on full data, not period)
  const fullAppSales: DailySales[] = allSales.map((day) => ({
    date: day.date,
    apps: day.apps[appId] ? { [appId]: day.apps[appId] } : {},
    totalDownloads: day.apps[appId]?.downloads ?? 0,
    totalRevenue: day.apps[appId]?.revenue ?? 0,
    totalProceeds: day.apps[appId]?.proceeds ?? 0,
  }));
  const anomalies = getAppAlerts(fullAppSales, appId);

  return (
    <>
      {/* Anomaly alerts */}
      {anomalies.length > 0 && (
        <div className="animate-fade-up space-y-2" style={{ animationDelay: "0.04s" }}>
          {anomalies.map((msg, i) => (
            <div key={i} className="card flex items-center gap-3 rounded-xl border-l-[3px] border-l-warning bg-warning-bg px-4 py-3">
              <span className="text-xs font-semibold text-warning-text">{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Period selector + Stats */}
      <div className="animate-fade-up space-y-3" style={{ animationDelay: "0.06s" }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-text-muted">{dateRange}</p>
          <div className="flex gap-0.5 rounded-lg bg-surface-inset p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  period === p.days
                    ? "bg-surface text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card rounded-xl px-5 py-4">
            <p className="section-label">Revenue</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-text-primary">
                ${totalProceeds.toFixed(2)}
              </span>
              <DeltaBadge current={totalProceeds} previous={prevProceeds} />
            </div>
          </div>
          <div className="card rounded-xl px-5 py-4">
            <p className="section-label">Downloads</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold tabular-nums text-text-primary">
                {totalDownloads}
              </span>
              <DeltaBadge current={totalDownloads} previous={prevDownloads} />
            </div>
          </div>
        </div>
      </div>

      {/* Chart + Country */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart data={sales} />
        </div>
        <CountryBreakdown sales={currentSlice} appId={appId} />
      </div>
    </>
  );
}
