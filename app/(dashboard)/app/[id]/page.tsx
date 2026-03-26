import { RatingBreakdown, ReviewsList } from "@/components/rating-breakdown";
import { RevenueChart } from "@/components/revenue-chart";
import { DownloadsChart } from "@/components/downloads-chart";
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

export default async function AppDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [rawSales, allApps, reviews] = await Promise.all([
    getSalesData(30),
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

  // Get icon
  const appEntries = allApps.map((a) => ({ id: a.app.id, territory: a.app.territory }));
  const storeData = await getAppStoreData(appEntries);
  const iconUrl = storeData.icons[id];
  const rating = storeData.ratings[id];

  const sales: DailySales[] = allSales.map((day) => ({
    date: day.date,
    apps: day.apps[id] ? { [id]: day.apps[id] } : {},
    totalDownloads: day.apps[id]?.downloads ?? 0,
    totalRevenue: day.apps[id]?.revenue ?? 0,
    totalProceeds: day.apps[id]?.proceeds ?? 0,
  }));

  const totalProceeds = sales.reduce((s, d) => s + d.totalProceeds, 0);
  const totalDownloads = sales.reduce((s, d) => s + d.totalDownloads, 0);

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
        Back
      </Link>

      {/* App header */}
      <div className="animate-fade-up flex items-start gap-4">
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt=""
            width={56}
            height={56}
            className="shrink-0 rounded-2xl shadow-sm"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-inset">
            <span className="text-xl font-bold text-text-muted">{name.charAt(0)}</span>
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">{name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-text-tertiary">
            <span>v{version}</span>
            <span className="text-text-faint">·</span>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${stateColor}`}>
              {stateLabel}
            </span>
            {rating && rating.count > 0 && (
              <>
                <span className="text-text-faint">·</span>
                <span className="text-warning-text">{rating.avg.toFixed(1)}★</span>
                <span className="text-text-muted">({rating.count})</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="animate-fade-up grid grid-cols-3 gap-4" style={{ animationDelay: "0.06s" }}>
        <div className="card rounded-xl px-5 py-4">
          <p className="section-label">30D Revenue</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
            ${totalProceeds.toFixed(2)}
          </p>
        </div>
        <div className="card rounded-xl px-5 py-4">
          <p className="section-label">30D Downloads</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
            {totalDownloads}
          </p>
        </div>
        <div className="card rounded-xl px-5 py-4">
          <p className="section-label">Bundle ID</p>
          <p className="mt-2 truncate font-mono text-sm text-text-secondary">
            {appInfo?.app.bundleId}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={sales} />
        <DownloadsChart data={sales} />
      </div>

      {/* Reviews */}
      <div>
        <h2 className="section-label mb-3">Reviews</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <RatingBreakdown reviews={reviews} />
          <div className="lg:col-span-2">
            <ReviewsList reviews={reviews} />
          </div>
        </div>
      </div>
    </div>
  );
}
