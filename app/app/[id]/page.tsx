import { RatingBreakdown, ReviewsList } from "@/components/rating-breakdown";
import { RevenueChart } from "@/components/revenue-chart";
import { DownloadsChart } from "@/components/downloads-chart";
import { getSalesData, getAppsData, getReviewsData } from "@/lib/data";
import type { DailySales } from "@/lib/types";
import Link from "next/link";

const STATE_SHORT: Record<string, string> = {
  READY_FOR_DISTRIBUTION: "LIVE",
  READY_FOR_SALE: "LIVE",
  PROCESSING_FOR_DISTRIBUTION: "PROCESSING",
  WAITING_FOR_REVIEW: "IN QUEUE",
  IN_REVIEW: "IN REVIEW",
  PENDING_DEVELOPER_RELEASE: "PENDING RELEASE",
  PREPARE_FOR_SUBMISSION: "DRAFT",
  REJECTED: "REJECTED",
  METADATA_REJECTED: "META REJECTED",
};

export default async function AppDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [allSales, allApps, reviews] = await Promise.all([
    getSalesData(30),
    getAppsData(),
    getReviewsData(id),
  ]);

  const appInfo = allApps.find((a) => a.app.id === id);
  const name = appInfo?.app.name ?? "Unknown App";
  const version = appInfo?.latestVersion?.versionString ?? "?";
  const state = appInfo?.latestVersion?.state ?? "UNKNOWN";
  const stateLabel = STATE_SHORT[state] ?? state;

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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border border-term-border px-3 py-2">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[10px] text-term-dim hover:text-neon-cyan">
            [ESC] BACK
          </Link>
          <span className="text-term-muted">|</span>
          <span className="font-semibold">{name}</span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-term-dim">v{version}</span>
          <span className={
            state.includes("READY") || state.includes("SALE")
              ? "text-neon-green"
              : state.includes("REJECT")
              ? "text-neon-red"
              : "text-neon-amber"
          }>
            {stateLabel}
          </span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex border border-term-border">
        <div className="flex-1 border-r border-term-border px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-term-dim">30D Revenue </span>
          <span className="text-lg font-semibold tabular-nums text-neon-green">
            ${totalProceeds.toFixed(2)}
          </span>
        </div>
        <div className="flex-1 border-r border-term-border px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-term-dim">30D Downloads </span>
          <span className="text-lg font-semibold tabular-nums text-neon-cyan">
            {totalDownloads}
          </span>
        </div>
        <div className="flex-1 px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-term-dim">Bundle </span>
          <span className="text-[11px] text-term-text">
            {appInfo?.app.bundleId}
          </span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <RevenueChart data={sales} />
        <DownloadsChart data={sales} />
      </div>

      {/* Reviews */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <RatingBreakdown reviews={reviews} />
        <div className="lg:col-span-2">
          <ReviewsList reviews={reviews} />
        </div>
      </div>
    </div>
  );
}
