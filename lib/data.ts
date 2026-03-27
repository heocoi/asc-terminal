import { unstable_cache } from "next/cache";
import { ascFetch, fetchSalesReport, fetchAllApps, fetchAppVersions, fetchAppTerritories, fetchReviews, fetchInAppPurchases, fetchIAPPriceSchedule, fetchSubscriptionGroups, fetchGroupSubscriptions, fetchSubscriptionPrice } from "./asc-client";
import { parseSalesReport, aggregateSales } from "./sales-parser";
import type { DailySales, AppStatus, AppInfo, AppVersion, Review, AlertItem, AppIcons, AppRatings, AppStoreMetaMap, AppPricingModel, SubscriptionInfo } from "./types";

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

// Merge IAP/subscription revenue into parent apps using SKU -> app ID mapping
export function mergeSalesWithApps(sales: DailySales[], apps: AppStatus[]): DailySales[] {
  // Build SKU -> Apple ID lookup from apps data
  const skuToId: Record<string, string> = {};
  for (const app of apps) {
    if (app.app.sku) {
      skuToId[app.app.sku] = app.app.id;
    }
  }

  return sales.map((day) => {
    const merged: DailySales["apps"] = {};

    for (const [id, entry] of Object.entries(day.apps)) {
      // If entry has a parentSku, try to find the parent app ID
      const parentId = entry.parentSku ? skuToId[entry.parentSku] : null;
      const targetId = parentId ?? id;

      if (!merged[targetId]) {
        merged[targetId] = { title: entry.title, downloads: 0, updates: 0, revenue: 0, proceeds: 0, countries: {} };
      }

      const target = merged[targetId];
      target.downloads += entry.downloads;
      target.updates += entry.updates;
      target.revenue += entry.revenue;
      target.proceeds += entry.proceeds;

      // Merge country data
      if (entry.countries) {
        for (const [cc, data] of Object.entries(entry.countries)) {
          if (!target.countries![cc]) target.countries![cc] = { proceeds: 0, downloads: 0 };
          target.countries![cc].proceeds += data.proceeds;
          target.countries![cc].downloads += data.downloads;
        }
      }

      // Keep parent app title, not IAP product name
      if (!parentId) {
        target.title = entry.title;
      }
    }

    // Recalculate totals
    let totalDownloads = 0;
    let totalRevenue = 0;
    let totalProceeds = 0;
    for (const entry of Object.values(merged)) {
      totalDownloads += entry.downloads;
      totalRevenue += entry.revenue;
      totalProceeds += entry.proceeds;
    }

    return { date: day.date, apps: merged, totalDownloads, totalRevenue, totalProceeds };
  });
}

export const getAppsData = unstable_cache(
  async (): Promise<AppStatus[]> => {
    const appsResponse = (await fetchAllApps()) as { data: ASCAppData[] };
    const apps = appsResponse.data;
    const statuses: AppStatus[] = [];

    for (let i = 0; i < apps.length; i += 10) {
      const batch = apps.slice(i, i + 10);
      const versionPromises = batch.map(async (app) => {
        try {
          const [versionsRes, territoriesRes] = await Promise.allSettled([
            fetchAppVersions(app.id) as Promise<{ data: ASCVersionData[] }>,
            fetchAppTerritories(app.id) as Promise<{ data: { id: string }[] }>,
          ]);
          const versions = versionsRes.status === "fulfilled" ? versionsRes.value.data || [] : [];
          const sorted = versions.sort(
            (a, b) => new Date(b.attributes.createdDate).getTime() - new Date(a.attributes.createdDate).getTime()
          );
          const latest = sorted[0];
          const territory = territoriesRes.status === "fulfilled"
            ? territoriesRes.value.data?.[0]?.id ?? ""
            : "";

          const appInfo: AppInfo = {
            id: app.id,
            name: app.attributes.name,
            bundleId: app.attributes.bundleId,
            sku: app.attributes.sku,
            primaryLocale: app.attributes.primaryLocale,
            platformDisplay: latest?.attributes.platform || "unknown",
            territory,
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
            app: { id: app.id, name: app.attributes.name, bundleId: app.attributes.bundleId, sku: app.attributes.sku, primaryLocale: app.attributes.primaryLocale, platformDisplay: "unknown", territory: "" },
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

interface StoreLookupResult {
  icons: AppIcons;
  ratings: AppRatings;
  meta: AppStoreMetaMap;
}

async function fetchStoreDataByCountry(ids: string, country: string): Promise<StoreLookupResult> {
  const icons: AppIcons = {};
  const ratings: AppRatings = {};
  const meta: AppStoreMetaMap = {};
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${ids}&country=${country}&entity=software`
    );
    if (res.ok) {
      const data = await res.json();
      for (const result of data.results ?? []) {
        const id = String(result.trackId);
        if (result.trackId && result.artworkUrl100) {
          icons[id] = result.artworkUrl100;
        }
        if (result.trackId) {
          ratings[id] = {
            avg: result.averageUserRating ?? 0,
            count: result.userRatingCount ?? 0,
          };
          meta[id] = {
            price: result.price ?? 0,
            formattedPrice: result.formattedPrice ?? "Free",
            genre: result.primaryGenreName ?? "",
            releaseDate: result.currentVersionReleaseDate ?? "",
            storeUrl: result.trackViewUrl ?? `https://apps.apple.com/app/id${id}`,
          };
        }
      }
    }
  } catch {
    // skip
  }
  return { icons, ratings, meta };
}

// ASC returns ISO 3166-1 alpha-3, iTunes lookup needs alpha-2
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  USA: "us", GBR: "gb", CAN: "ca", AUS: "au", VNM: "vn", JPN: "jp",
  KOR: "kr", CHN: "cn", TWN: "tw", FRA: "fr", DEU: "de", ESP: "es",
  MEX: "mx", BRA: "br", ITA: "it", NLD: "nl", RUS: "ru", THA: "th",
  IDN: "id", MYS: "my", SGP: "sg", PHL: "ph", IND: "in", SAU: "sa",
  ARE: "ae", TUR: "tr", POL: "pl", SWE: "se", NOR: "no", DNK: "dk",
  FIN: "fi", CHE: "ch", AUT: "at", BEL: "be", PRT: "pt", IRL: "ie",
  NZL: "nz", ZAF: "za", ARG: "ar", COL: "co", CHL: "cl", PER: "pe",
  UKR: "ua", ROU: "ro", CZE: "cz", HUN: "hu", GRC: "gr", ISR: "il",
  EGY: "eg", NGA: "ng", KEN: "ke", PAK: "pk", BGD: "bd", HKG: "hk",
};

function territoryToCountry(territory: string): string {
  return ALPHA3_TO_ALPHA2[territory] ?? "us";
}

export const getAppStoreData = unstable_cache(
  async (apps: { id: string; territory: string }[]): Promise<{ icons: AppIcons; ratings: AppRatings; meta: AppStoreMetaMap }> => {
    const byCountry: Record<string, string[]> = {};
    for (const app of apps) {
      const country = app.territory ? territoryToCountry(app.territory) : "us";
      (byCountry[country] ??= []).push(app.id);
    }

    const results = await Promise.all(
      Object.entries(byCountry).map(([country, ids]) =>
        fetchStoreDataByCountry(ids.join(","), country)
      )
    );

    const icons: AppIcons = {};
    const ratings: AppRatings = {};
    const meta: AppStoreMetaMap = {};
    for (const r of results) {
      Object.assign(icons, r.icons);
      Object.assign(ratings, r.ratings);
      Object.assign(meta, r.meta);
    }

    return { icons, ratings, meta };
  },
  ["app-store-data"],
  { revalidate: 86400 }
);

const SUB_TYPES = new Set(["AUTO_RENEWABLE", "NON_RENEWING"]);

interface ASCIAPData {
  id: string;
  attributes: { inAppPurchaseType: string; state: string; name: string };
}

export const getAppPricing = unstable_cache(
  async (appId: string, storePrice: number, territory = "USA"): Promise<AppPricingModel> => {
    let iapCount = 0;
    let subscriptionCount = 0;
    let minIAPPrice: number | null = null;
    let approvedIAPs: ASCIAPData[] = [];

    try {
      const res = (await fetchInAppPurchases(appId)) as { data?: ASCIAPData[] };
      approvedIAPs = (res.data || []).filter(iap => iap.attributes.state === "APPROVED");
      subscriptionCount = approvedIAPs.filter(iap => SUB_TYPES.has(iap.attributes.inAppPurchaseType)).length;
      iapCount = approvedIAPs.length - subscriptionCount;
    } catch {
      // IAP list fetch may fail
    }

    // Fetch actual set prices for up to 5 IAPs
    // Strategy: get price schedule (has encoded price point ID) + all price points, then match
    if (approvedIAPs.length > 0) {
      const toFetch = approvedIAPs.slice(0, 5);
      const results = await Promise.allSettled(
        toFetch.map(async (iap) => {
          // Step 1: get price schedule to find which price point is set
          const schedule = (await fetchIAPPriceSchedule(iap.id)) as {
            included?: { id: string; type: string }[];
          };
          const priceEntry = (schedule.included ?? []).find(i => i.type === "inAppPurchasePrices");
          if (!priceEntry) return null;

          // Step 2: decode base64 ID to get price point number
          let pointNumber: string | null = null;
          try {
            const decoded = JSON.parse(Buffer.from(priceEntry.id, "base64").toString());
            pointNumber = decoded.p;
          } catch { return null; }
          if (!pointNumber) return null;

          // Step 3: paginate price points for territory until we find the matching one
          let nextPath: string | null = `/v2/inAppPurchases/${iap.id}/pricePoints?filter[territory]=${territory}&fields[inAppPurchasePricePoints]=customerPrice&limit=200`;
          while (nextPath) {
            const points = (await ascFetch(nextPath)) as {
              data?: { id: string; attributes?: { customerPrice?: string } }[];
              links?: { next?: string };
            };
            for (const pp of points.data ?? []) {
              try {
                const decoded = JSON.parse(Buffer.from(pp.id, "base64").toString());
                if (decoded.p === pointNumber) {
                  return parseFloat(pp.attributes?.customerPrice ?? "0");
                }
              } catch { continue; }
            }
            const next = points.links?.next;
            nextPath = next ? next.replace("https://api.appstoreconnect.apple.com", "") : null;
          }
          return null;
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value && result.value > 0) {
          if (minIAPPrice === null || result.value < minIAPPrice) {
            minIAPPrice = result.value;
          }
        }
      }
    }

    // Fetch subscription prices
    const subscriptions: SubscriptionInfo[] = [];
    try {
      const groups = (await fetchSubscriptionGroups(appId)) as {
        data?: { id: string }[];
      };
      for (const group of (groups.data ?? []).slice(0, 3)) {
        const subs = (await fetchGroupSubscriptions(group.id)) as {
          data?: { id: string; attributes: { name: string; productId: string; state: string } }[];
        };
        const approved = (subs.data ?? []).filter(s => s.attributes.state === "APPROVED");
        const priceResults = await Promise.allSettled(
          approved.map(async (sub) => {
            const priceRes = (await fetchSubscriptionPrice(sub.id, territory)) as {
              included?: { type: string; attributes?: { customerPrice?: string } }[];
            };
            const pp = (priceRes.included ?? []).find(i => i.type === "subscriptionPricePoints");
            const price = parseFloat(pp?.attributes?.customerPrice ?? "0");
            return { name: sub.attributes.name, price, productId: sub.attributes.productId };
          })
        );
        for (const r of priceResults) {
          if (r.status === "fulfilled" && r.value.price > 0) {
            subscriptions.push(r.value);
            subscriptionCount++;
          }
        }
      }
    } catch {
      // No subscription groups
    }

    const isFree = storePrice === 0;
    const hasIAP = iapCount > 0;
    const hasSubscription = subscriptions.length > 0;

    // Build price tag: prefer subscription price, fallback to IAP
    const lowestSub = subscriptions.length > 0
      ? Math.min(...subscriptions.map(s => s.price))
      : null;
    const lowestPrice = lowestSub ?? minIAPPrice;
    const priceTag = lowestPrice ? `from $${lowestPrice.toFixed(2)}` : "";

    let model: string;
    if (isFree && hasSubscription && hasIAP) {
      model = priceTag ? `Free + Sub + IAP (${priceTag})` : "Free + Sub + IAP";
    } else if (isFree && hasSubscription) {
      model = priceTag ? `Free + Subscription (${priceTag})` : "Free + Subscription";
    } else if (isFree && hasIAP) {
      model = priceTag ? `Freemium (${priceTag})` : "Freemium";
    } else if (isFree) {
      model = "Free";
    } else if (hasSubscription) {
      model = priceTag ? `$${storePrice.toFixed(2)} + Sub (${priceTag})` : `$${storePrice.toFixed(2)} + Subscription`;
    } else if (hasIAP) {
      model = priceTag ? `$${storePrice.toFixed(2)} + IAP (${priceTag})` : `$${storePrice.toFixed(2)} + IAP`;
    } else {
      model = `$${storePrice.toFixed(2)}`;
    }

    return {
      basePrice: isFree ? "Free" : `$${storePrice.toFixed(2)}`,
      hasIAP,
      hasSubscription,
      iapCount,
      subscriptionCount,
      minIAPPrice,
      subscriptions,
      model,
    };
  },
  ["app-pricing"],
  { revalidate: 86400 }
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

const REJECTION_STATES = new Set(["REJECTED", "DEVELOPER_REJECTED", "METADATA_REJECTED", "INVALID_BINARY"]);
const REVIEW_STATES = new Set(["WAITING_FOR_REVIEW", "IN_REVIEW"]);

export function getAlerts(apps: AppStatus[], sales: DailySales[]): AlertItem[] {
  const alerts: AlertItem[] = [];

  for (const app of apps) {
    const state = app.latestVersion?.state ?? "";
    const ver = app.latestVersion?.versionString ?? "?";

    // Rejected builds (red)
    if (REJECTION_STATES.has(state)) {
      const stateLabel: Record<string, string> = {
        REJECTED: "Rejected by App Review",
        DEVELOPER_REJECTED: "Rejected by developer",
        METADATA_REJECTED: "Metadata rejected",
        INVALID_BINARY: "Invalid binary",
      };
      alerts.push({
        type: "rejected",
        severity: "red",
        title: app.app.name,
        detail: `v${ver} - ${stateLabel[state] ?? state}`,
        appId: app.app.id,
        appName: app.app.name,
        version: ver,
        timestamp: app.latestVersion?.createdDate,
      });
    }

    // Waiting for review / in review (blue - informational)
    if (REVIEW_STATES.has(state)) {
      alerts.push({
        type: "in_review",
        severity: "blue",
        title: app.app.name,
        detail: `v${ver} - ${state === "IN_REVIEW" ? "In review" : "Waiting for review"}`,
        appId: app.app.id,
        appName: app.app.name,
        version: ver,
        timestamp: app.latestVersion?.createdDate,
      });
    }
  }

  // Download anomalies
  if (sales.length >= 10) {
    const recent3 = sales.slice(-3);
    const prior7 = sales.slice(-10, -3);
    const recentAvg = recent3.reduce((s, d) => s + d.totalDownloads, 0) / 3;
    const priorAvg = prior7.reduce((s, d) => s + d.totalDownloads, 0) / 7;
    if (priorAvg > 0) {
      const dropPct = ((priorAvg - recentAvg) / priorAvg) * 100;
      if (dropPct > 40) {
        alerts.push({
          type: "anomaly",
          severity: "amber",
          title: "Download drop",
          detail: `${dropPct.toFixed(0)}% drop vs prior week (${recentAvg.toFixed(0)}/day vs ${priorAvg.toFixed(0)}/day)`,
        });
      }
      const spikePct = ((recentAvg - priorAvg) / priorAvg) * 100;
      if (spikePct > 100) {
        alerts.push({
          type: "anomaly",
          severity: "amber",
          title: "Download spike",
          detail: `+${spikePct.toFixed(0)}% vs prior week (${recentAvg.toFixed(0)}/day vs ${priorAvg.toFixed(0)}/day)`,
        });
      }
    }
  }

  // Sort: red first, then amber, then blue
  const severityOrder = { red: 0, amber: 1, blue: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

export const getRecentBadReviews = unstable_cache(
  async (apps: AppStatus[]): Promise<Review[]> => {
    const badReviews: Review[] = [];
    // Fetch 3 recent reviews per app, filter to 1-2 stars
    const batches = [];
    for (let i = 0; i < apps.length; i += 10) {
      batches.push(apps.slice(i, i + 10));
    }

    for (const batch of batches) {
      const results = await Promise.all(
        batch.map(async (app) => {
          try {
            const res = (await fetchReviews(app.app.id, 5)) as { data: ASCReviewData[] };
            return (res.data || [])
              .filter((r) => r.attributes.rating <= 2)
              .slice(0, 3)
              .map((r) => ({
                id: r.id,
                title: r.attributes.title,
                body: r.attributes.body,
                rating: r.attributes.rating,
                reviewerNickname: r.attributes.reviewerNickname,
                createdDate: r.attributes.createdDate,
                territory: r.attributes.territory,
                appName: app.app.name,
                appId: app.app.id,
              }));
          } catch {
            return [];
          }
        })
      );
      badReviews.push(...results.flat());
    }

    return badReviews
      .sort((a, b) => b.createdDate.localeCompare(a.createdDate))
      .slice(0, 10);
  },
  ["bad-reviews"],
  { revalidate: 3600 }
);
