import { RatingBreakdown, ReviewsList } from "@/components/rating-breakdown";
import { TrendChart } from "@/components/trend-chart";
import { CountryBreakdown } from "@/components/country-breakdown";
import { getSalesData, getAppsData, getReviewsData, getAppStoreData, mergeSalesWithApps } from "@/lib/data";
import type { DailySales } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

const STATE_LABEL: Record<string, string> = {
  READY_FOR_DISTRIBUTION: "Live",
  READY_FOR_SALE: "Live",
  PROCESSING_FOR_DISTRIBUTION: "Processing",
  WAITING_FOR_REVIEW: "In Queue",
  IN_REVIEW: "In Review",
  PENDING_DEVELOPER_RELEASE: "Pending Release",
  PREPARE_FOR_SUBMISSION: "Draft",
  REJECTED: "Rejected",
  METADATA_REJECTED: "Meta Rejected",
};

const STATE_COLOR: Record<string, string> = {
  Live: "text-positive-text bg-positive-bg",
  Processing: "text-info-text bg-info-bg",
  "In Queue": "text-warning-text bg-warning-bg",
  "In Review": "text-warning-text bg-warning-bg",
  "Pending Release": "text-info-text bg-info-bg",
  Draft: "text-text-muted bg-surface-inset",
  Rejected: "text-negative-text bg-negative-bg",
  "Meta Rejected": "text-negative-text bg-negative-bg",
};

const PLATFORM_SHORT: Record<string, string> = {
  IOS: "iOS",
  MAC_OS: "macOS",
  APPLE_TV: "tvOS",
  VISION_OS: "visionOS",
};

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

function getAppAlerts(sales: DailySales[], appId: string): string[] {
  const alerts: string[] = [];
  if (sales.length < 10) return alerts;

  const recent3 = sales.slice(-3);
  const prior7 = sales.slice(-10, -3);

  // Revenue anomaly
  const recentRevAvg = recent3.reduce((s, d) => s + (d.apps[appId]?.proceeds ?? 0), 0) / 3;
  const priorRevAvg = prior7.reduce((s, d) => s + (d.apps[appId]?.proceeds ?? 0), 0) / 7;
  if (priorRevAvg > 0) {
    const dropPct = ((priorRevAvg - recentRevAvg) / priorRevAvg) * 100;
    if (dropPct > 40) alerts.push(`Revenue dropped ${dropPct.toFixed(0)}% vs prior week`);
    const spikePct = ((recentRevAvg - priorRevAvg) / priorRevAvg) * 100;
    if (spikePct > 100) alerts.push(`Revenue spiked +${spikePct.toFixed(0)}% vs prior week`);
  }

  // Download anomaly
  const recentDlAvg = recent3.reduce((s, d) => s + (d.apps[appId]?.downloads ?? 0), 0) / 3;
  const priorDlAvg = prior7.reduce((s, d) => s + (d.apps[appId]?.downloads ?? 0), 0) / 7;
  if (priorDlAvg > 0) {
    const dropPct = ((priorDlAvg - recentDlAvg) / priorDlAvg) * 100;
    if (dropPct > 40) alerts.push(`Downloads dropped ${dropPct.toFixed(0)}% vs prior week`);
    const spikePct = ((recentDlAvg - priorDlAvg) / priorDlAvg) * 100;
    if (spikePct > 100) alerts.push(`Downloads spiked +${spikePct.toFixed(0)}% vs prior week`);
  }

  return alerts;
}

export default async function AppDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Fetch 60 days for period comparison
  const [rawSales, allApps, reviews] = await Promise.all([
    getSalesData(60),
    getAppsData(),
    getReviewsData(id),
  ]);
  const allSales = mergeSalesWithApps(rawSales, allApps);

  const appInfo = allApps.find((a) => a.app.id === id);
  const name = appInfo?.app.name ?? "Unknown App";
  const version = appInfo?.latestVersion?.versionString ?? "?";
  const state = appInfo?.latestVersion?.state ?? "UNKNOWN";
  const stateLabel = STATE_LABEL[state] ?? state;
  const stateColor = STATE_COLOR[stateLabel] ?? "text-text-muted bg-surface-inset";
  const platform = PLATFORM_SHORT[appInfo?.app.platformDisplay ?? ""] ?? appInfo?.app.platformDisplay ?? "";

  const appEntries = allApps.map((a) => ({ id: a.app.id, territory: a.app.territory }));
  const storeData = await getAppStoreData(appEntries);
  const iconUrl = storeData.icons[id];
  const storeRating = storeData.ratings[id];

  // Current 30 days
  const last30 = allSales.slice(-30);
  const sales: DailySales[] = last30.map((day) => ({
    date: day.date,
    apps: day.apps[id] ? { [id]: day.apps[id] } : {},
    totalDownloads: day.apps[id]?.downloads ?? 0,
    totalRevenue: day.apps[id]?.revenue ?? 0,
    totalProceeds: day.apps[id]?.proceeds ?? 0,
  }));

  // Previous 30 days for comparison
  const prev30 = allSales.slice(0, -30);

  const totalProceeds = sales.reduce((s, d) => s + d.totalProceeds, 0);
  const totalDownloads = sales.reduce((s, d) => s + d.totalDownloads, 0);
  const prevProceeds = prev30.reduce((s, d) => s + (d.apps[id]?.proceeds ?? 0), 0);
  const prevDownloads = prev30.reduce((s, d) => s + (d.apps[id]?.downloads ?? 0), 0);

  const firstDate = sales[0]?.date ?? "";
  const lastDate = sales[sales.length - 1]?.date ?? "";
  const dateRange = firstDate && lastDate ? `${fmtShort(firstDate)} - ${fmtShort(lastDate)}` : "";

  const hasReviews = reviews.length > 0;
  const hasStoreRating = storeRating && storeRating.count > 0;

  // Per-app anomaly detection
  const anomalies = getAppAlerts(allSales.map((day) => ({
    date: day.date,
    apps: day.apps[id] ? { [id]: day.apps[id] } : {},
    totalDownloads: day.apps[id]?.downloads ?? 0,
    totalRevenue: day.apps[id]?.revenue ?? 0,
    totalProceeds: day.apps[id]?.proceeds ?? 0,
  })), id);

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-tertiary transition-colors hover:text-text-primary"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 3L4.5 7L8.5 11" />
        </svg>
        Dashboard
      </Link>

      {/* App header */}
      <div className="animate-fade-up flex items-start gap-4">
        {iconUrl ? (
          <Image src={iconUrl} alt="" width={56} height={56} className="shrink-0 rounded-2xl shadow-sm" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-inset">
            <span className="text-xl font-bold text-text-muted">{name.charAt(0)}</span>
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">{name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-text-tertiary">
            <span>{platform}</span>
            <span className="text-text-faint">·</span>
            <span>v{version}</span>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${stateColor}`}>
              {stateLabel}
            </span>
            {hasStoreRating && (
              <>
                <span className="text-text-faint">·</span>
                <span className="text-warning-text">{storeRating.avg.toFixed(1)}★</span>
                <span className="text-text-muted">({storeRating.count})</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Per-app anomaly alerts */}
      {anomalies.length > 0 && (
        <div className="animate-fade-up space-y-2" style={{ animationDelay: "0.04s" }}>
          {anomalies.map((msg, i) => (
            <div key={i} className="card flex items-center gap-3 rounded-xl border-l-[3px] border-l-warning bg-warning-bg px-4 py-3">
              <span className="text-xs font-semibold text-warning-text">{msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats with delta */}
      <div className="animate-fade-up grid grid-cols-2 gap-3" style={{ animationDelay: "0.06s" }}>
        <div className="card rounded-xl px-5 py-4">
          <p className="section-label">Revenue</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums text-text-primary">
              ${totalProceeds.toFixed(2)}
            </span>
            <DeltaBadge current={totalProceeds} previous={prevProceeds} />
          </div>
          <p className="mt-1 text-[11px] text-text-muted">{dateRange}</p>
        </div>
        <div className="card rounded-xl px-5 py-4">
          <p className="section-label">Downloads</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums text-text-primary">
              {totalDownloads}
            </span>
            <DeltaBadge current={totalDownloads} previous={prevDownloads} />
          </div>
          <p className="mt-1 text-[11px] text-text-muted">{dateRange}</p>
        </div>
      </div>

      {/* Chart + Country side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart data={sales} />
        </div>
        <CountryBreakdown sales={last30} appId={id} />
      </div>

      {/* Reviews */}
      {(hasReviews || hasStoreRating) && (
        <div>
          <h2 className="section-label mb-3">Reviews</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {hasReviews ? (
              <RatingBreakdown reviews={reviews} />
            ) : hasStoreRating ? (
              <div className="card rounded-xl px-5 py-4">
                <p className="section-label">App Store Rating</p>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-bold text-text-primary">
                    {storeRating.avg.toFixed(1)}
                  </span>
                  <span className="text-sm text-text-muted">/ 5</span>
                </div>
                <p className="mt-1 text-xs text-text-muted">{storeRating.count} ratings</p>
              </div>
            ) : null}
            <div className="lg:col-span-2">
              <ReviewsList reviews={reviews} />
            </div>
          </div>
        </div>
      )}

      {/* App info - secondary */}
      <div className="border-t border-border pt-6">
        <h2 className="section-label mb-3">App Info</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-text-muted">Bundle ID</p>
            <p className="mt-0.5 truncate font-mono text-text-secondary">{appInfo?.app.bundleId}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">SKU</p>
            <p className="mt-0.5 font-mono text-text-secondary">{appInfo?.app.sku}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Platform</p>
            <p className="mt-0.5 text-text-secondary">{platform}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Locale</p>
            <p className="mt-0.5 text-text-secondary">{appInfo?.app.primaryLocale}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
