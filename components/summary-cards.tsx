"use client";

import type { DailySales } from "@/lib/types";

function sumRange(data: DailySales[], days: number) {
  const slice = data.slice(-days);
  return {
    revenue: slice.reduce((s, d) => s + d.totalProceeds, 0),
    downloads: slice.reduce((s, d) => s + d.totalDownloads, 0),
  };
}

export function SummaryCards({ data }: { data: DailySales[] }) {
  const d1 = sumRange(data, 1);
  const d7 = sumRange(data, 7);
  const d30 = sumRange(data, 30);

  const cards = [
    { label: "Today", revenue: d1.revenue, downloads: d1.downloads },
    { label: "7 Days", revenue: d7.revenue, downloads: d7.downloads },
    { label: "30 Days", revenue: d30.revenue, downloads: d30.downloads },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <p className="text-xs font-medium text-zinc-500">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            ${c.revenue.toFixed(2)}
          </p>
          <p className="mt-0.5 text-sm text-zinc-500">
            {c.downloads.toLocaleString()} downloads
          </p>
        </div>
      ))}
    </div>
  );
}
