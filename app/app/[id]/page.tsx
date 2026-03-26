import { RatingBreakdown, ReviewsList } from "@/components/rating-breakdown";
import { RevenueChart } from "@/components/revenue-chart";
import { DownloadsChart } from "@/components/downloads-chart";
import type { DailySales, AppStatus, Review } from "@/lib/types";
import Link from "next/link";

function getBaseUrl() {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

async function getAppSales(appId: string): Promise<DailySales[]> {
  const res = await fetch(`${getBaseUrl()}/api/sales?days=30`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const allSales: DailySales[] = await res.json();

  // Filter to only this app's data
  return allSales.map((day) => ({
    date: day.date,
    apps: day.apps[appId] ? { [appId]: day.apps[appId] } : {},
    totalDownloads: day.apps[appId]?.downloads ?? 0,
    totalRevenue: day.apps[appId]?.revenue ?? 0,
    totalProceeds: day.apps[appId]?.proceeds ?? 0,
  }));
}

async function getAppInfo(appId: string): Promise<AppStatus | null> {
  const res = await fetch(`${getBaseUrl()}/api/apps`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const apps: AppStatus[] = await res.json();
  return apps.find((a) => a.app.id === appId) ?? null;
}

async function getReviews(appId: string): Promise<Review[]> {
  const res = await fetch(`${getBaseUrl()}/api/reviews?appId=${appId}&limit=10`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return res.json();
}

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
  const [sales, appInfo, reviews] = await Promise.all([
    getAppSales(id),
    getAppInfo(id),
    getReviews(id),
  ]);

  const name = appInfo?.app.name ?? "Unknown App";
  const version = appInfo?.latestVersion?.versionString ?? "?";
  const state = appInfo?.latestVersion?.state ?? "UNKNOWN";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
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
