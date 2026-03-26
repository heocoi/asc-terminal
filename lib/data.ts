import { unstable_cache } from "next/cache";
import { fetchSalesReport, fetchAllApps, fetchAppVersions, fetchReviews } from "./asc-client";
import { parseSalesReport, aggregateSales } from "./sales-parser";
import type { DailySales, AppStatus, AppInfo, AppVersion, Review } from "./types";

interface ASCAppData {
  id: string;
  attributes: {
    name: string;
    bundleId: string;
    sku: string;
    primaryLocale: string;
  };
}

interface ASCVersionData {
  id: string;
  attributes: {
    versionString: string;
    appStoreState: string;
    platform: string;
    createdDate: string;
  };
}

interface ASCReviewData {
  id: string;
  attributes: {
    title: string;
    body: string;
    rating: number;
    reviewerNickname: string;
    createdDate: string;
    territory: string;
  };
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

async function fetchDaySales(date: string): Promise<DailySales | null> {
  try {
    const res = await fetchSalesReport(date);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const records = parseSalesReport(buffer);
    return aggregateSales(records, date);
  } catch {
    return null;
  }
}

function getHealth(state: string): AppStatus["health"] {
  const greenStates = new Set(["READY_FOR_DISTRIBUTION", "PROCESSING_FOR_DISTRIBUTION", "READY_FOR_SALE"]);
  const yellowStates = new Set(["WAITING_FOR_REVIEW", "IN_REVIEW", "PENDING_DEVELOPER_RELEASE", "PREPARE_FOR_SUBMISSION", "WAITING_FOR_EXPORT_COMPLIANCE"]);
  const redStates = new Set(["REJECTED", "DEVELOPER_REJECTED", "METADATA_REJECTED", "REMOVED_FROM_SALE", "DEVELOPER_REMOVED_FROM_SALE", "INVALID_BINARY"]);
  if (greenStates.has(state)) return "green";
  if (yellowStates.has(state)) return "yellow";
  if (redStates.has(state)) return "red";
  return "unknown";
}

export const getSalesData = unstable_cache(
  async (days: number = 30): Promise<DailySales[]> => {
    const results: DailySales[] = [];
    const today = new Date();

    for (let batch = 0; batch < days; batch += 5) {
      const promises: Promise<DailySales | null>[] = [];
      for (let i = batch; i < Math.min(batch + 5, days); i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i - 1);
        promises.push(fetchDaySales(formatDate(d)));
      }
      const batchResults = await Promise.all(promises);
      for (const r of batchResults) {
        if (r) results.push(r);
      }
    }

    results.sort((a, b) => a.date.localeCompare(b.date));
    return results;
  },
  ["sales-data"],
  { revalidate: 3600 }
);

export const getAppsData = unstable_cache(
  async (): Promise<AppStatus[]> => {
    const appsResponse = (await fetchAllApps()) as { data: ASCAppData[] };
    const apps = appsResponse.data;
    const statuses: AppStatus[] = [];

    for (let i = 0; i < apps.length; i += 10) {
      const batch = apps.slice(i, i + 10);
      const versionPromises = batch.map(async (app) => {
        try {
          const versionsRes = (await fetchAppVersions(app.id)) as { data: ASCVersionData[] };
          const sorted = (versionsRes.data || []).sort(
            (a, b) => new Date(b.attributes.createdDate).getTime() - new Date(a.attributes.createdDate).getTime()
          );
          const latest = sorted[0];

          const appInfo: AppInfo = {
            id: app.id,
            name: app.attributes.name,
            bundleId: app.attributes.bundleId,
            sku: app.attributes.sku,
            primaryLocale: app.attributes.primaryLocale,
            platformDisplay: latest?.attributes.platform || "unknown",
          };

          const latestVersion: AppVersion | null = latest
            ? {
                id: latest.id,
                versionString: latest.attributes.versionString,
                state: latest.attributes.appStoreState,
                platform: latest.attributes.platform,
                createdDate: latest.attributes.createdDate,
              }
            : null;

          return { app: appInfo, latestVersion, health: latest ? getHealth(latest.attributes.appStoreState) : "unknown" } as AppStatus;
        } catch {
          return {
            app: { id: app.id, name: app.attributes.name, bundleId: app.attributes.bundleId, sku: app.attributes.sku, primaryLocale: app.attributes.primaryLocale, platformDisplay: "unknown" },
            latestVersion: null,
            health: "unknown",
          } as AppStatus;
        }
      });

      statuses.push(...(await Promise.all(versionPromises)));
    }

    return statuses;
  },
  ["apps-data"],
  { revalidate: 3600 }
);

export const getReviewsData = unstable_cache(
  async (appId: string, limit = 10): Promise<Review[]> => {
    const res = (await fetchReviews(appId, limit)) as { data: ASCReviewData[] };
    return (res.data || []).map((r) => ({
      id: r.id,
      title: r.attributes.title,
      body: r.attributes.body,
      rating: r.attributes.rating,
      reviewerNickname: r.attributes.reviewerNickname,
      createdDate: r.attributes.createdDate,
      territory: r.attributes.territory,
    }));
  },
  ["reviews-data"],
  { revalidate: 3600 }
);
