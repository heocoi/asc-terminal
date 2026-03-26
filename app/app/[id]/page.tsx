import { RatingBreakdown, ReviewsList } from "@/components/rating-breakdown";
import { RevenueChart } from "@/components/revenue-chart";
import { DownloadsChart } from "@/components/downloads-chart";
import { getSalesData, getAppsData, getReviewsData } from "@/lib/data";
import type { DailySales } from "@/lib/types";
import Link from "next/link";

const STATE_LABELS: Record<string, string> = {
  READY_FOR_DISTRIBUTION: "Live",
  READY_FOR_SALE: "Live",
  PROCESSING_FOR_DISTRIBUTION: "Processing",
  WAITING_FOR_REVIEW: "In Review Queue",
  IN_REVIEW: "In Review",
  PENDING_DEVELOPER_RELEASE: "Pending Release",
  PREPARE_FOR_SUBMISSION: "Draft",
  REJECTED: "Rejected",
  METADATA_REJECTED: "Metadata Rejected",
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

  // Filter sales to only this app
  const sales: DailySales[] = allSales.map((day) => ({
    date: day.date,
    apps: day.apps[id] ? { [id]: day.apps[id] } : {},
    totalDownloads: day.apps[id]?.downloads ?? 0,
    totalRevenue: day.apps[id]?.revenue ?? 0,
    totalProceeds: day.apps[id]?.proceeds ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-sm text-zinc-500">
            v{version} · {STATE_LABELS[state] ?? state} ·{" "}
            {appInfo?.app.bundleId}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={sales} />
        <DownloadsChart data={sales} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RatingBreakdown reviews={reviews} />
        <div className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-medium text-zinc-400">
            Recent Reviews
          </h3>
          <ReviewsList reviews={reviews} />
        </div>
      </div>
    </div>
  );
}
