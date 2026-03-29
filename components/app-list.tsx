"use client";

import { useState, useEffect } from "react";
import type { AppStatus, DailySales, AppIcons, AppRatings } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

const STATE_LABEL: Record<string, string> = {
  READY_FOR_DISTRIBUTION: "Live",
  READY_FOR_SALE: "Live",
  PROCESSING_FOR_DISTRIBUTION: "Processing",
  WAITING_FOR_REVIEW: "In Queue",
  IN_REVIEW: "In Review",
  PENDING_DEVELOPER_RELEASE: "Pending",
  PREPARE_FOR_SUBMISSION: "Draft",
  REJECTED: "Rejected",
  METADATA_REJECTED: "Meta Rejected",
  DEVELOPER_REJECTED: "Dev Rejected",
  REMOVED_FROM_SALE: "Removed",
  DEVELOPER_REMOVED_FROM_SALE: "Dev Removed",
};

const NON_LIVE_BADGE: Record<string, string> = {
  red: "text-negative-text bg-negative-bg",
  yellow: "text-warning-text bg-warning-bg",
  unknown: "text-text-muted bg-surface-inset",
};

const PLATFORM_SHORT: Record<string, string> = {
  IOS: "iOS",
  MAC_OS: "macOS",
  APPLE_TV: "tvOS",
  VISION_OS: "visionOS",
};

const PERIODS = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
] as const;

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const allZero = values.every((v) => v === 0);
  if (allZero) return null;

  const width = 48;
  const height = 20;
  const step = width / Math.max(values.length - 1, 1);
  const points = values
    .map((v, i) => `${i * step},${height - (v / max) * (height - 4) - 2}`)
    .join(" ");

  const last3 = values.slice(-3);
  const first3 = values.slice(0, 3);
  const lastAvg = last3.reduce((s, v) => s + v, 0) / last3.length;
  const firstAvg = first3.reduce((s, v) => s + v, 0) / first3.length;
  const isUp = lastAvg >= firstAvg;

  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "#16A34A" : "#DC2626"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

interface AppRow {
  app: AppStatus;
  revenue: number;
  downloads: number;
  subscriptionRevenue: number;
  sparkline: number[];
  hasActivity: boolean;
}

function getAppRows(apps: AppStatus[], sales: DailySales[], days: number): AppRow[] {
  const slice = sales.slice(-days);

  return apps
    .map((app) => {
      const revenue = slice.reduce(
        (s, d) => s + (d.apps[app.app.id]?.proceeds ?? 0), 0
      );
      const downloads = slice.reduce(
        (s, d) => s + (d.apps[app.app.id]?.downloads ?? 0), 0
      );
      const subscriptionRevenue = slice.reduce(
        (s, d) => s + (d.apps[app.app.id]?.subscriptionRevenue ?? 0), 0
      );
      const sparkline = slice.map(
        (d) => d.apps[app.app.id]?.downloads ?? 0
      );
      const hasActivity = revenue > 0 || downloads > 0;

      return { app, revenue, downloads, subscriptionRevenue, sparkline, hasActivity };
    })
    .sort((a, b) => b.revenue - a.revenue || b.downloads - a.downloads);
}

type EngagementSummary = Record<string, { impressions: number; pageViews: number; conversionRate: number }>;

function AppRowItem({
  row,
  icons,
  ratings,
  pricingModel,
  conversionRate,
}: {
  row: AppRow;
  icons: AppIcons;
  ratings: AppRatings;
  pricingModel?: string;
  conversionRate?: number;
}) {
  const state = row.app.latestVersion?.state ?? "UNKNOWN";
  const stateLabel = STATE_LABEL[state] ?? state;
  const health = row.app.health;
  const isLive = health === "green";
  const hasRevenue = row.revenue > 0;
  const rating = ratings[row.app.app.id];
  const platform = PLATFORM_SHORT[row.app.app.platformDisplay] ?? row.app.app.platformDisplay;

  return (
    <Link
      href={`/app/${row.app.app.id}`}
      className="group flex items-center gap-3 px-4 py-3 transition-all hover:bg-surface-hover first:rounded-t-xl last:rounded-b-xl"
    >
      {/* Icon */}
      {icons[row.app.app.id] ? (
        <Image
          src={icons[row.app.app.id]}
          alt=""
          width={36}
          height={36}
          className="shrink-0 rounded-[9px] shadow-sm transition-transform group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-surface-inset">
          <span className="text-xs font-bold text-text-muted">
            {row.app.app.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Name + meta + status badge inline */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-text-primary transition-colors group-hover:text-accent-text">
            {row.app.app.name}
          </p>
          {!isLive && (
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${NON_LIVE_BADGE[health] ?? NON_LIVE_BADGE.unknown}`}>
              {stateLabel}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-text-muted">
          <span>{platform}</span>
          <span className="text-text-faint">·</span>
          <span>v{row.app.latestVersion?.versionString ?? "?"}</span>
          {rating && rating.count > 0 && (
            <>
              <span className="text-text-faint">·</span>
              <span className="text-warning-text">{rating.avg.toFixed(1)}★</span>
            </>
          )}
          {conversionRate !== undefined && conversionRate > 0 && (
            <>
              <span className="text-text-faint">·</span>
              <span className="text-info-text">{(conversionRate * 100).toFixed(1)}% CVR</span>
            </>
          )}
          {pricingModel && pricingModel !== "Free" && (
            <>
              <span className="text-text-faint">·</span>
              <span className="text-accent-text">{pricingModel}</span>
            </>
          )}
        </div>
      </div>

      {/* Sparkline */}
      <div className="hidden w-12 sm:block">
        <Sparkline values={row.sparkline} />
      </div>

      {/* Revenue + Downloads stacked */}
      <div className="w-20 text-right">
        <p className={`font-mono text-sm tabular-nums ${
          hasRevenue ? "font-semibold text-text-primary" : "text-text-faint"
        }`}>
          {hasRevenue ? `$${row.revenue.toFixed(2)}` : "--"}
        </p>
        <div className={`flex items-center justify-end gap-1 font-mono text-[11px] tabular-nums ${
          row.downloads > 0 ? "text-text-muted" : "text-text-faint"
        }`}>
          {row.subscriptionRevenue > 0 && (
            <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0 text-accent-text">
              <path d="M7.5 3.5A3 3 0 0 0 2 4.5M2.5 6.5A3 3 0 0 0 8 5.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          )}
          {row.downloads > 0 ? `${row.downloads} DLs` : ""}
        </div>
      </div>
    </Link>
  );
}

export function AppList({
  apps,
  sales,
  icons = {},
  ratings = {},
  pricingModels = {},
}: {
  apps: AppStatus[];
  sales: DailySales[];
  icons?: AppIcons;
  ratings?: AppRatings;
  pricingModels?: Record<string, string>;
}) {
  const [period, setPeriod] = useState<number>(7);
  const [showInactive, setShowInactive] = useState(false);
  const [engagement, setEngagement] = useState<EngagementSummary>({});
  const rows = getAppRows(apps, sales, period);

  useEffect(() => {
    fetch("/api/analytics/engagement?days=30")
      .then((r) => r.json())
      .then((data) => { if (data && typeof data === "object") setEngagement(data); })
      .catch(() => {});
  }, []);

  const active = rows.filter((r) => r.hasActivity);
  const inactive = rows.filter((r) => !r.hasActivity);

  return (
    <div className="animate-fade-up" style={{ animationDelay: "0.12s" }}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-label">Portfolio</h2>
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

      {/* Active apps */}
      <div className="card mt-1 divide-y divide-border rounded-xl">
        {active.map((row) => (
          <AppRowItem key={row.app.app.id} row={row} icons={icons} ratings={ratings} pricingModel={pricingModels[row.app.app.id]} conversionRate={engagement[row.app.app.id]?.conversionRate} />
        ))}
        {active.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-text-muted">
            No activity in this period
          </div>
        )}
      </div>

      {/* Inactive apps - collapsible */}
      {inactive.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-tertiary"
          >
            <span className="h-px flex-1 bg-border" />
            <span>{inactive.length} inactive</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
              className={`transition-transform ${showInactive ? "rotate-180" : ""}`}>
              <path d="M2 3.5L5 6.5L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="h-px flex-1 bg-border" />
          </button>

          {showInactive && (
            <div className="card mt-2 divide-y divide-border rounded-xl opacity-60">
              {inactive.map((row) => (
                <AppRowItem key={row.app.app.id} row={row} icons={icons} ratings={ratings} pricingModel={pricingModels[row.app.app.id]} conversionRate={engagement[row.app.app.id]?.conversionRate} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
