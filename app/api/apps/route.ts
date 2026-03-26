import { NextResponse } from "next/server";
import { fetchAllApps, fetchAppVersions } from "@/lib/asc-client";
import type { AppStatus, AppInfo, AppVersion } from "@/lib/types";

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

function getHealth(state: string): AppStatus["health"] {
  const greenStates = new Set([
    "READY_FOR_DISTRIBUTION",
    "PROCESSING_FOR_DISTRIBUTION",
    "READY_FOR_SALE",
  ]);
  const yellowStates = new Set([
    "WAITING_FOR_REVIEW",
    "IN_REVIEW",
    "PENDING_DEVELOPER_RELEASE",
    "PREPARE_FOR_SUBMISSION",
    "WAITING_FOR_EXPORT_COMPLIANCE",
  ]);
  const redStates = new Set([
    "REJECTED",
    "DEVELOPER_REJECTED",
    "METADATA_REJECTED",
    "REMOVED_FROM_SALE",
    "DEVELOPER_REMOVED_FROM_SALE",
    "INVALID_BINARY",
  ]);

  if (greenStates.has(state)) return "green";
  if (yellowStates.has(state)) return "yellow";
  if (redStates.has(state)) return "red";
  return "unknown";
}

export async function GET() {
  const appsResponse = (await fetchAllApps()) as { data: ASCAppData[] };
  const apps = appsResponse.data;

  // Fetch versions for all apps in parallel (batches of 10)
  const statuses: AppStatus[] = [];

  for (let i = 0; i < apps.length; i += 10) {
    const batch = apps.slice(i, i + 10);
    const versionPromises = batch.map(async (app) => {
      try {
        const versionsRes = (await fetchAppVersions(app.id)) as { data: ASCVersionData[] };
        // Sort by createdDate descending (API doesn't support sort param)
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

        return {
          app: appInfo,
          latestVersion,
          health: latest ? getHealth(latest.attributes.appStoreState) : "unknown",
        } as AppStatus;
      } catch {
        return {
          app: {
            id: app.id,
            name: app.attributes.name,
            bundleId: app.attributes.bundleId,
            sku: app.attributes.sku,
            primaryLocale: app.attributes.primaryLocale,
            platformDisplay: "unknown",
          },
          latestVersion: null,
          health: "unknown",
        } as AppStatus;
      }
    });

    const batchResults = await Promise.all(versionPromises);
    statuses.push(...batchResults);
  }

  return NextResponse.json(statuses, {
    headers: {
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=1800",
    },
  });
}
