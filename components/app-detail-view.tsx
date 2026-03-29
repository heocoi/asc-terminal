"use client";

import { useState } from "react";
import { TrendChart } from "@/components/trend-chart";
import { CountryBreakdown } from "@/components/country-breakdown";
import { SubscriptionChart } from "@/components/subscription-chart";
import type { DailySales, EngagementMetrics, SubscriptionEventMetrics, SubscriptionStateMetrics } from "@/lib/types";
import { DeltaBadge } from "@/components/delta-badge";
import { fmtShort } from "@/lib/format";

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

export function AppDetailView({
  allSales,
  appId,
  engagement = [],
  subEvents = [],
  subState = [],
}: {
  allSales: DailySales[];
  appId: string;
  engagement?: EngagementMetrics[];
  subEvents?: SubscriptionEventMetrics[];
  subState?: SubscriptionStateMetrics[];
}) {
  const [period, setPeriod] = useState<number>(30);

  // Slice data for selected period
  const currentSlice = allSales.slice(-period);
  const prevSlice = allSales.slice(0, -period);

  // Build single-app sales for chart
  const sales: DailySales[] = currentSlice.map((day) => {
    const app = day.apps[appId];
    return {
      date: day.date,
      apps: app ? { [appId]: app } : {},
      totalDownloads: app?.downloads ?? 0,
      totalRevenue: app?.revenue ?? 0,
      totalProceeds: app?.proceeds ?? 0,
      totalRefunds: app?.refunds ?? 0,
      totalSubscriptionRevenue: app?.subscriptionRevenue ?? 0,
    };
  });

  const totalProceeds = currentSlice.reduce((s, d) => s + (d.apps[appId]?.proceeds ?? 0), 0);
  const totalDownloads = currentSlice.reduce((s, d) => s + (d.apps[appId]?.downloads ?? 0), 0);
  const totalSubRevenue = currentSlice.reduce((s, d) => s + (d.apps[appId]?.subscriptionRevenue ?? 0), 0);
  const totalRefunds = currentSlice.reduce((s, d) => s + (d.apps[appId]?.refunds ?? 0), 0);
  const prevProceeds = prevSlice.reduce((s, d) => s + (d.apps[appId]?.proceeds ?? 0), 0);
  const prevDownloads = prevSlice.reduce((s, d) => s + (d.apps[appId]?.downloads ?? 0), 0);
  const prevSubRevenue = prevSlice.reduce((s, d) => s + (d.apps[appId]?.subscriptionRevenue ?? 0), 0);

  const firstDate = currentSlice[0]?.date ?? "";
  const lastDate = currentSlice[currentSlice.length - 1]?.date ?? "";
  const dateRange = firstDate && lastDate ? `${fmtShort(firstDate)} - ${fmtShort(lastDate)}` : "";

  // Anomaly detection (always based on full data, not period)
  const fullAppSales: DailySales[] = allSales.map((day) => {
    const app = day.apps[appId];
    return {
      date: day.date,
      apps: app ? { [appId]: app } : {},
      totalDownloads: app?.downloads ?? 0,
      totalRevenue: app?.revenue ?? 0,
      totalProceeds: app?.proceeds ?? 0,
      totalRefunds: app?.refunds ?? 0,
      totalSubscriptionRevenue: app?.subscriptionRevenue ?? 0,
    };
  });
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

        {(() => {
          // Only show sub card when it adds info (not when sub ≈ total revenue)
          const subPct = totalProceeds > 0 ? totalSubRevenue / totalProceeds : 0;
          const showSubCard = totalSubRevenue > 0 && subPct < 0.95;
          return (
            <div className={`grid gap-3 ${showSubCard ? "grid-cols-3" : "grid-cols-2"}`}>
              <div className="card rounded-xl px-5 py-4">
                <p className="section-label">Revenue</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-bold tabular-nums text-text-primary">
                    ${totalProceeds.toFixed(2)}
                  </span>
                  <DeltaBadge current={totalProceeds} previous={prevProceeds} />
                </div>
                {totalRefunds > 0 && (
                  <p className="mt-1 text-[11px] text-negative-text">
                    -${totalRefunds.toFixed(2)} refunds
                  </p>
                )}
                {totalSubRevenue > 0 && !showSubCard && (
                  <p className="mt-1 text-[11px] text-accent-text">
                    100% subscription
                  </p>
                )}
              </div>
              {showSubCard && (
                <div className="card rounded-xl px-5 py-4">
                  <p className="section-label">Subscriptions</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold tabular-nums text-text-primary">
                      ${totalSubRevenue.toFixed(2)}
                    </span>
                    <DeltaBadge current={totalSubRevenue} previous={prevSubRevenue} />
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {`${(subPct * 100).toFixed(0)}% of revenue`}
                  </p>
                </div>
              )}
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
          );
        })()}
      </div>

      {/* Chart + Country */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart data={sales} />
        </div>
        <CountryBreakdown sales={currentSlice} appId={appId} />
      </div>

      {/* Engagement metrics (from Analytics Reports API) */}
      {engagement.length > 0 && (
        <div className="animate-fade-up space-y-3" style={{ animationDelay: "0.14s" }}>
          <h3 className="section-label">App Store Engagement</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="card rounded-xl px-5 py-4">
              <p className="section-label">Impressions</p>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
                {engagement.reduce((s, e) => s + e.impressions, 0).toLocaleString()}
              </p>
            </div>
            <div className="card rounded-xl px-5 py-4">
              <p className="section-label">Page Views</p>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
                {engagement.reduce((s, e) => s + e.pageViews, 0).toLocaleString()}
              </p>
            </div>
            <div className="card rounded-xl px-5 py-4">
              <p className="section-label">Conversion Rate</p>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
                {(() => {
                  const imp = engagement.reduce((s, e) => s + e.impressions, 0);
                  const avgRate = imp > 0
                    ? (totalDownloads / imp) * 100
                    : 0;
                  return `${avgRate.toFixed(1)}%`;
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription analytics (from Analytics Reports API) */}
      {(subState.length > 0 || subEvents.length > 0) && (
        <div className="animate-fade-up space-y-3" style={{ animationDelay: "0.16s" }}>
          <h3 className="section-label">Subscription Analytics</h3>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {subState.length > 0 && (() => {
              const latest = subState[subState.length - 1];
              return (
                <>
                  <div className="card rounded-xl px-5 py-4">
                    <p className="section-label">Active Paid</p>
                    <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
                      {latest.activePaid}
                    </p>
                  </div>
                  <div className="card rounded-xl px-5 py-4">
                    <p className="section-label">Free Trials</p>
                    <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
                      {latest.activeFreeTrial}
                    </p>
                  </div>
                  {latest.billingIssue > 0 && (
                    <div className="card rounded-xl px-5 py-4">
                      <p className="section-label">Billing Issues</p>
                      <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-warning-text">
                        {latest.billingIssue}
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
            {subEvents.length > 0 && (() => {
              const totalTrials = subEvents.reduce((s, e) => s + e.trialStarts, 0);
              const totalConversions = subEvents.reduce((s, e) => s + e.trialConversions, 0);
              const totalChurns = subEvents.reduce((s, e) => s + e.voluntaryChurns + e.involuntaryChurns, 0);
              const convRate = totalTrials > 0 ? (totalConversions / totalTrials) * 100 : 0;
              return (
                <>
                  {totalTrials > 0 && (
                    <div className="card rounded-xl px-5 py-4">
                      <p className="section-label">Trial Starts</p>
                      <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
                        {totalTrials}
                      </p>
                      {convRate > 0 && (
                        <p className="mt-1 text-[11px] text-text-muted">
                          {convRate.toFixed(0)}% converted
                        </p>
                      )}
                    </div>
                  )}
                  {totalChurns > 0 && (
                    <div className="card rounded-xl px-5 py-4">
                      <p className="section-label">Churns</p>
                      <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-negative-text">
                        {totalChurns}
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Subscription trend chart */}
          <SubscriptionChart stateData={subState} eventData={subEvents} />
        </div>
      )}
    </>
  );
}
