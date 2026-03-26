"use client";

import { useEffect, useRef, useState } from "react";
import type { DailySales } from "@/lib/types";

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const ref = useRef(0);

  useEffect(() => {
    const start = ref.current;
    const diff = target - start;
    if (Math.abs(diff) < 0.01) { setValue(target); return; }

    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setValue(current);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = target;
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
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

function filterRange(data: DailySales[], startDate: string, endDate: string): DailySales[] {
  return data.filter((d) => d.date >= startDate && d.date <= endDate);
}

function monthStart(dateStr: string): string {
  return dateStr.slice(0, 7) + "-01";
}

function prevMonthRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr);
  const prevMonth = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const dayOfMonth = d.getDate();
  const lastDayPrevMonth = new Date(d.getFullYear(), d.getMonth(), 0).getDate();
  const endDay = Math.min(dayOfMonth, lastDayPrevMonth);
  const start = prevMonth.toISOString().split("T")[0];
  const end = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), endDay)
    .toISOString().split("T")[0];
  return { start, end };
}

function prevDayStr(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function CardSparkline({ values, color = "#4F46E5" }: { values: number[]; color?: string }) {
  if (values.length < 2 || values.every(v => v === 0)) return null;
  const max = Math.max(...values, 1);
  const w = 200, h = 32;
  const step = w / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => `${i * step},${h - (v / max) * (h - 4) - 2}`);
  const fillPoints = [...points, `${w},${h}`, `0,${h}`].join(" ");
  const linePoints = points.join(" ");

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-auto block opacity-30">
      <polygon points={fillPoints} fill={color} opacity="0.15" />
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RevenueTicker({ data }: { data: DailySales[] }) {
  if (data.length === 0) return null;

  const lastDay = data[data.length - 1];
  const lastDate = lastDay.date;
  const prevDay = data.find((d) => d.date === prevDayStr(lastDate));

  const latestRevenue = lastDay.totalProceeds;
  const latestDownloads = lastDay.totalDownloads;
  const prevDayRevenue = prevDay?.totalProceeds ?? 0;
  const prevDayDownloads = prevDay?.totalDownloads ?? 0;

  const thisMonthStart = monthStart(lastDate);
  const thisMonthData = filterRange(data, thisMonthStart, lastDate);
  const thisMonthRevenue = thisMonthData.reduce((s, d) => s + d.totalProceeds, 0);
  const thisMonthDownloads = thisMonthData.reduce((s, d) => s + d.totalDownloads, 0);
  const prev = prevMonthRange(lastDate);
  const prevMonthData = filterRange(data, prev.start, prev.end);
  const prevMonthRevenue = prevMonthData.reduce((s, d) => s + d.totalProceeds, 0);
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthName = MONTHS_LONG[parseInt(lastDate.split("-")[1], 10) - 1];

  const animatedRevenue = useCountUp(latestRevenue);

  // 7-day totals
  const last7 = data.slice(-7);
  const weekRevenue = last7.reduce((s, d) => s + d.totalProceeds, 0);
  const weekDownloads = last7.reduce((s, d) => s + d.totalDownloads, 0);
  const first7Date = last7[0]?.date ?? lastDate;

  // Sparkline from last 14 days
  const sparkValues = data.slice(-14).map(d => d.totalProceeds);

  // Format helpers - parse string directly to avoid timezone shift
  const fmtShort = (d: string) => {
    const [, m, day] = d.split("-");
    return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(day, 10)}`;
  };
  const fmtMonthDay = (d: string) => String(parseInt(d.split("-")[2], 10));

  return (
    <div className="animate-fade-up">
      {/* Stats grid */}
      <div className="grid grid-cols-12 gap-3">
        {/* Hero: latest day revenue */}
        <div className="col-span-5 card flex flex-col overflow-hidden rounded-2xl">
          <div className="px-5 pt-4">
            <p className="section-label">{fmtShort(lastDate)}</p>
            <div className="mt-2 flex items-baseline gap-2.5">
              <span className="animate-count-up font-mono text-3xl font-extrabold tracking-tight text-text-primary">
                ${animatedRevenue.toFixed(2)}
              </span>
              <DeltaBadge current={latestRevenue} previous={prevDayRevenue} />
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              {latestDownloads} downloads
              {prevDayDownloads > 0 && (
                <span className="ml-1">
                  <DeltaBadge current={latestDownloads} previous={prevDayDownloads} />
                </span>
              )}
            </p>
          </div>
          <CardSparkline values={sparkValues} />
        </div>

        {/* 7-day summary */}
        <div className="col-span-3 card flex flex-col overflow-hidden rounded-2xl">
          <div className="px-5 pt-4">
            <p className="section-label">{fmtShort(first7Date)} - {fmtMonthDay(lastDate)}</p>
            <p className="mt-2 font-mono text-xl font-bold tabular-nums text-text-primary">
              ${weekRevenue.toFixed(2)}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">
              {weekDownloads} downloads
            </p>
          </div>
          <CardSparkline values={last7.map(d => d.totalProceeds)} color="#0EA5E9" />
        </div>

        {/* Month-to-date */}
        <div className="col-span-4 card flex flex-col overflow-hidden rounded-2xl">
          <div className="px-5 pt-4">
            <p className="section-label">{monthName} 1 - {fmtMonthDay(lastDate)}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold tabular-nums text-text-primary">
                ${thisMonthRevenue.toFixed(2)}
              </span>
              <DeltaBadge current={thisMonthRevenue} previous={prevMonthRevenue} />
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              {thisMonthDownloads} downloads
            </p>
          </div>
          <CardSparkline values={thisMonthData.map(d => d.totalProceeds)} color="#10B981" />
        </div>
      </div>
    </div>
  );
}
