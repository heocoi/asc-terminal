import { ascFetch, ascPost, ascDownload } from "./asc-client";
import type {
  AnalyticsReportRequest,
  AnalyticsReportMeta,
  AnalyticsReportInstance,
  AnalyticsSegment,
  AnalyticsCategory,
} from "./types";

// Step 1: Create ONGOING report request for an app
export async function createReportRequest(appId: string): Promise<string> {
  const res = (await ascPost("/v1/analyticsReportRequests", {
    data: {
      type: "analyticsReportRequests",
      attributes: { accessType: "ONGOING" },
      relationships: {
        app: { data: { type: "apps", id: appId } },
      },
    },
  })) as { data: { id: string } };
  return res.data.id;
}

// Step 2: List existing report requests for an app
export async function getReportRequests(appId: string): Promise<AnalyticsReportRequest[]> {
  const res = (await ascFetch(`/v1/apps/${appId}/analyticsReportRequests`)) as {
    data: { id: string; attributes: { accessType: string; stoppedDueToInactivity: boolean } }[];
  };
  return (res.data ?? []).map((r) => ({
    id: r.id,
    accessType: r.attributes.accessType as AnalyticsReportRequest["accessType"],
    stoppedDueToInactivity: r.attributes.stoppedDueToInactivity,
  }));
}

// Step 3: Get reports for a request, filtered by category
export async function getReports(
  requestId: string,
  category: AnalyticsCategory
): Promise<{ id: string; meta: AnalyticsReportMeta }[]> {
  const res = (await ascFetch(
    `/v1/analyticsReportRequests/${requestId}/reports`,
    { params: { "filter[category]": category } }
  )) as {
    data: { id: string; attributes: { category: string; name: string } }[];
  };
  return (res.data ?? []).map((r) => ({
    id: r.id,
    meta: { category: r.attributes.category, name: r.attributes.name },
  }));
}

// Step 4: Get report instances (daily/weekly/monthly)
export async function getReportInstances(
  reportId: string,
  granularity: "DAILY" | "WEEKLY" | "MONTHLY" = "DAILY",
  limit = 30
): Promise<AnalyticsReportInstance[]> {
  const res = (await ascFetch(
    `/v1/analyticsReports/${reportId}/instances`,
    {
      params: {
        "filter[granularity]": granularity,
        limit: String(limit),
      },
    }
  )) as {
    data: { id: string; attributes: { granularity: string; processingDate: string } }[];
  };
  return (res.data ?? []).map((i) => ({
    id: i.id,
    granularity: i.attributes.granularity,
    processingDate: i.attributes.processingDate,
  }));
}

// Step 5: Get downloadable segments for an instance
export async function getReportSegments(instanceId: string): Promise<AnalyticsSegment[]> {
  const res = (await ascFetch(
    `/v1/analyticsReportInstances/${instanceId}/segments`
  )) as {
    data: { id: string; attributes: { url: string; checksum: string } }[];
  };
  return (res.data ?? []).map((s) => ({
    id: s.id,
    url: s.attributes.url,
    checksum: s.attributes.checksum,
  }));
}

// Step 6: Download and decompress a segment
export async function downloadSegment(url: string): Promise<string> {
  const buffer = await ascDownload(url);
  // Analytics reports are gzip-compressed tab-delimited
  const { gunzipSync } = await import("zlib");
  try {
    return gunzipSync(buffer).toString("utf-8");
  } catch {
    // Some segments may not be gzipped
    return buffer.toString("utf-8");
  }
}

// High-level: fetch all data for a category + app
export async function fetchAnalyticsReport(
  appId: string,
  category: AnalyticsCategory,
  days = 30
): Promise<Record<string, string>[]> {
  // Find ONGOING request
  const requests = await getReportRequests(appId);
  const ongoing = requests.find(
    (r) => r.accessType === "ONGOING" && !r.stoppedDueToInactivity
  );
  if (!ongoing) return [];

  // Get reports for category
  const reports = await getReports(ongoing.id, category);
  if (reports.length === 0) return [];

  // Get recent daily instances
  const instances = await getReportInstances(reports[0].id, "DAILY", days);
  if (instances.length === 0) return [];

  // Download segments in parallel (batch of 5)
  const allRecords: Record<string, string>[] = [];
  for (let i = 0; i < instances.length; i += 5) {
    const batch = instances.slice(i, i + 5);
    const segmentResults = await Promise.allSettled(
      batch.map(async (inst) => {
        const segments = await getReportSegments(inst.id);
        if (segments.length === 0) return [];
        // Download first segment (usually only one per instance)
        const text = await downloadSegment(segments[0].url);
        return parseTabDelimited(text);
      })
    );
    for (const result of segmentResults) {
      if (result.status === "fulfilled") {
        allRecords.push(...result.value);
      }
    }
  }

  return allRecords;
}

// Parse tab-delimited text into records
function parseTabDelimited(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t").map((h) => h.trim());
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split("\t");
    if (values.length < headers.length) continue;
    const record: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j]?.trim() ?? "";
    }
    records.push(record);
  }

  return records;
}
