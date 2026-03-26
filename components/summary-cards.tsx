"use client";

import type { DailySales } from "@/lib/types";

function sumRange(data: DailySales[], days: number) {
  const slice = data.slice(-days);
  return {
    revenue: slice.reduce((s, d) => s + d.totalProceeds, 0),
    downloads: slice.reduce((s, d) => s + d.totalDownloads, 0),
  };
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const isUp = pct >= 0;
  return (
    <span className={isUp ? "text-neon-green" : "text-neon-red"}>
      {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export function SummaryCards({ data }: { data: DailySales[] }) {
  const d1 = sumRange(data, 1);
  const d7 = sumRange(data, 7);
  const d7prev = sumRange(data.slice(0, -7), 7);
  const d30 = sumRange(data, 30);

  return (
    <div className="border border-term-border">
      <div className="flex border-b border-term-border">
        <div className="border-r border-term-border px-4 py-2 text-[10px] uppercase tracking-widest text-term-dim">
          Revenue
        </div>
        <div className="flex flex-1">
          <div className="flex-1 border-r border-term-border px-4 py-2">
            <span className="text-[10px] uppercase tracking-wider text-term-dim">1D </span>
            <span className="text-lg font-semibold tabular-nums text-neon-green">
              ${d1.revenue.toFixed(2)}
            </span>
          </div>
          <div className="flex-1 border-r border-term-border px-4 py-2">
            <span className="text-[10px] uppercase tracking-wider text-term-dim">7D </span>
            <span className="text-lg font-semibold tabular-nums text-neon-green">
              ${d7.revenue.toFixed(2)}
            </span>
            <span className="ml-2 text-[10px]">
              <Delta current={d7.revenue} previous={d7prev.revenue} />
            </span>
          </div>
          <div className="flex-1 px-4 py-2">
            <span className="text-[10px] uppercase tracking-wider text-term-dim">30D </span>
            <span className="text-lg font-semibold tabular-nums text-neon-green">
              ${d30.revenue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex">
        <div className="border-r border-term-border px-4 py-2 text-[10px] uppercase tracking-widest text-term-dim">
          Downloads
        </div>
        <div className="flex flex-1">
          <div className="flex-1 border-r border-term-border px-4 py-2">
            <span className="text-[10px] uppercase tracking-wider text-term-dim">1D </span>
            <span className="text-lg font-semibold tabular-nums text-neon-cyan">
              {d1.downloads}
            </span>
          </div>
          <div className="flex-1 border-r border-term-border px-4 py-2">
            <span className="text-[10px] uppercase tracking-wider text-term-dim">7D </span>
            <span className="text-lg font-semibold tabular-nums text-neon-cyan">
              {d7.downloads}
            </span>
            <span className="ml-2 text-[10px]">
              <Delta current={d7.downloads} previous={d7prev.downloads} />
            </span>
          </div>
          <div className="flex-1 px-4 py-2">
            <span className="text-[10px] uppercase tracking-wider text-term-dim">30D </span>
            <span className="text-lg font-semibold tabular-nums text-neon-cyan">
              {d30.downloads}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
