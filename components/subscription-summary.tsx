"use client";

import type { DailySales } from "@/lib/types";

interface SubAppSummary {
  appId: string;
  name: string;
  subRevenue: number;
  totalRevenue: number;
}

export function SubscriptionSummary({ sales }: { sales: DailySales[] }) {
  // Aggregate subscription revenue per app across all days
  const appMap = new Map<string, SubAppSummary>();

  for (const day of sales) {
    for (const [id, app] of Object.entries(day.apps)) {
      if (!appMap.has(id)) {
        appMap.set(id, { appId: id, name: app.title, subRevenue: 0, totalRevenue: 0 });
      }
      const entry = appMap.get(id)!;
      entry.subRevenue += app.subscriptionRevenue;
      entry.totalRevenue += app.proceeds;
    }
  }

  const appsWithSubs = [...appMap.values()]
    .filter((a) => a.subRevenue > 0)
    .sort((a, b) => b.subRevenue - a.subRevenue);

  if (appsWithSubs.length === 0) return null;

  const totalSubRevenue = appsWithSubs.reduce((s, a) => s + a.subRevenue, 0);
  const totalRevenue = [...appMap.values()].reduce((s, a) => s + a.totalRevenue, 0);
  const subPct = totalRevenue > 0 ? (totalSubRevenue / totalRevenue) * 100 : 0;

  return (
    <div className="card animate-fade-up rounded-xl" style={{ animationDelay: "0.22s" }}>
      <div className="px-5 py-4">
        <h3 className="section-label">Subscription Revenue</h3>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="font-mono text-2xl font-bold tabular-nums text-text-primary">
            ${totalSubRevenue.toFixed(2)}
          </span>
          <span className="text-xs text-text-muted">
            {subPct.toFixed(0)}% of total revenue
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-inset">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.min(subPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Top subscription apps */}
      <div className="border-t border-border">
        {appsWithSubs.slice(0, 5).map((app) => (
          <div key={app.appId} className="flex items-center justify-between px-5 py-2.5">
            <span className="truncate text-sm text-text-secondary">{app.name}</span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold tabular-nums text-text-primary">
                ${app.subRevenue.toFixed(2)}
              </span>
              <span className="w-10 text-right text-[11px] text-text-muted">
                {app.totalRevenue > 0 ? `${((app.subRevenue / app.totalRevenue) * 100).toFixed(0)}%` : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
