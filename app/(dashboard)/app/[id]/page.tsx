import { RatingBreakdown, ReviewsList } from "@/components/rating-breakdown";
import { AppDetailView } from "@/components/app-detail-view";
import { getSalesData, getAppsData, getReviewsData, getAppStoreData, getAppPricing, mergeSalesWithApps, getEngagementData, getSubscriptionEventData, getSubscriptionStateData, getUsageData } from "@/lib/data";
import { UsageMetrics } from "@/components/usage-metrics";
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

export default async function AppDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [rawSales, allApps, reviews, engagementResult, subEventsResult, subStateResult, usageResult] = await Promise.allSettled([
    getSalesData(60),
    getAppsData(),
    getReviewsData(id),
    getEngagementData(id, 60),
    getSubscriptionEventData(id, 60),
    getSubscriptionStateData(id, 60),
    getUsageData(id, 30),
  ]);
  const rawSalesData = rawSales.status === "fulfilled" ? rawSales.value : [];
  const allAppsData = allApps.status === "fulfilled" ? allApps.value : [];
  const reviewsData = reviews.status === "fulfilled" ? reviews.value : [];
  const engagement = engagementResult.status === "fulfilled" ? engagementResult.value : [];
  const subEvents = subEventsResult.status === "fulfilled" ? subEventsResult.value : [];
  const subState = subStateResult.status === "fulfilled" ? subStateResult.value : [];
  const usageData = usageResult.status === "fulfilled" ? usageResult.value : [];
  const allSales = mergeSalesWithApps(rawSalesData, allAppsData);

  const appInfo = allAppsData.find((a) => a.app.id === id);
  const name = appInfo?.app.name ?? "Unknown App";
  const version = appInfo?.latestVersion?.versionString ?? "?";
  const state = appInfo?.latestVersion?.state ?? "UNKNOWN";
  const stateLabel = STATE_LABEL[state] ?? state;
  const stateColor = STATE_COLOR[stateLabel] ?? "text-text-muted bg-surface-inset";
  const platform = PLATFORM_SHORT[appInfo?.app.platformDisplay ?? ""] ?? appInfo?.app.platformDisplay ?? "";

  const appEntries = allAppsData.map((a) => ({ id: a.app.id, territory: a.app.territory }));
  const storeData = await getAppStoreData(appEntries);
  const iconUrl = storeData.icons[id];
  const storeRating = storeData.ratings[id];
  const storeMeta = storeData.meta[id];
  const pricing = await getAppPricing(id, storeMeta?.price ?? 0);

  const hasReviews = reviewsData.length > 0;
  const hasStoreRating = storeRating && storeRating.count > 0;

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
            {pricing.model !== "Free" && (
              <>
                <span className="text-text-faint">·</span>
                <span className="text-accent-text text-[11px]">{pricing.model}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive section: anomaly + stats + period selector + chart + country */}
      <AppDetailView
        allSales={allSales}
        appId={id}
        engagement={engagement}
        subEvents={subEvents}
        subState={subState}
      />

      {/* Usage metrics (opt-in analytics) */}
      {usageData.length > 0 && (
        <UsageMetrics data={{
          sessions: usageData.reduce((s, d) => s + d.sessions, 0),
          crashes: usageData.reduce((s, d) => s + d.crashes, 0),
          activeDevices: usageData.length > 0 ? usageData[usageData.length - 1].activeDevices : 0,
          installations: usageData.reduce((s, d) => s + d.installations, 0),
          deletions: usageData.reduce((s, d) => s + d.deletions, 0),
        }} />
      )}

      {/* Reviews */}
      {(hasReviews || hasStoreRating) && (
        <div>
          <h2 className="section-label mb-3">Reviews</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {hasReviews ? (
              <RatingBreakdown reviews={reviewsData} />
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
              <ReviewsList reviews={reviewsData} />
            </div>
          </div>
        </div>
      )}

      {/* App info */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h2 className="section-label">App Info</h2>
          {storeMeta?.storeUrl && (
            <a
              href={storeMeta.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface-inset px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6.5V9.5C9 10.05 8.55 10.5 8 10.5H2.5C1.95 10.5 1.5 10.05 1.5 9.5V4C1.5 3.45 1.95 3 2.5 3H5.5" />
                <path d="M7.5 1.5H10.5V4.5" />
                <path d="M5 7L10.5 1.5" />
              </svg>
              App Store
            </a>
          )}
        </div>
        {/* Pricing breakdown */}
        <div className="mt-3 card rounded-xl px-5 py-4">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-text-secondary">{pricing.model}</p>
          </div>
          {(pricing.subscriptions.length > 0 || pricing.hasIAP) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {pricing.subscriptions.map((sub) => (
                <span key={sub.productId} className="rounded-md bg-accent-subtle px-2.5 py-1 text-xs text-accent-text">
                  {sub.name} <span className="font-mono font-semibold">${sub.price.toFixed(2)}</span>
                </span>
              ))}
              {pricing.minIAPPrice !== null && (
                <span className="rounded-md bg-surface-inset px-2.5 py-1 text-xs text-text-secondary">
                  IAP from <span className="font-mono font-semibold">${pricing.minIAPPrice.toFixed(2)}</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
          {storeMeta?.genre && (
            <div>
              <p className="text-xs text-text-muted">Category</p>
              <p className="mt-0.5 text-text-secondary">{storeMeta.genre}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-text-muted">Platform</p>
            <p className="mt-0.5 text-text-secondary">{platform}</p>
          </div>
          {storeMeta?.releaseDate && (
            <div>
              <p className="text-xs text-text-muted">Last Release</p>
              <p className="mt-0.5 text-text-secondary">
                {new Date(storeMeta.releaseDate).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-text-muted">Bundle ID</p>
            <p className="mt-0.5 truncate font-mono text-text-secondary">{appInfo?.app.bundleId}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">SKU</p>
            <p className="mt-0.5 font-mono text-text-secondary">{appInfo?.app.sku}</p>
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
