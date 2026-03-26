import { getToken } from "./asc-auth";

const BASE_URL = "https://api.appstoreconnect.apple.com";

export async function ascFetch(
  path: string,
  options?: { params?: Record<string, string>; rawResponse?: boolean }
): Promise<Response | unknown> {
  const token = await getToken();
  const url = new URL(path, BASE_URL);

  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, value);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ASC API ${res.status}: ${text}`);
  }

  if (options?.rawResponse) return res;
  return res.json();
}

export async function fetchSalesReport(
  date: string,
  frequency: "DAILY" | "WEEKLY" = "DAILY"
): Promise<Response> {
  const token = await getToken();
  const url = new URL("/v1/salesReports", BASE_URL);
  url.searchParams.set("filter[reportType]", "SALES");
  url.searchParams.set("filter[reportSubType]", "SUMMARY");
  url.searchParams.set("filter[frequency]", frequency);
  url.searchParams.set("filter[reportDate]", date);
  url.searchParams.set("filter[vendorNumber]", process.env.ASC_VENDOR_NUMBER || "");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/a-gzip",
    },
  });

  return res;
}

export async function fetchAllApps(): Promise<unknown> {
  return ascFetch("/v1/apps", {
    params: {
      "fields[apps]": "name,bundleId,sku,primaryLocale",
      limit: "200",
    },
  });
}

export async function fetchAppVersions(appId: string): Promise<unknown> {
  return ascFetch(`/v1/apps/${appId}/appStoreVersions`, {
    params: {
      "fields[appStoreVersions]": "versionString,appStoreState,platform,createdDate",
      limit: "5",
    },
  });
}

export async function fetchAppTerritories(appId: string): Promise<unknown> {
  return ascFetch(`/v1/apps/${appId}/availableTerritories`, {
    params: { limit: "1" },
  });
}

export async function fetchAppPriceSchedule(appId: string): Promise<unknown> {
  return ascFetch(`/v1/apps/${appId}/appPriceSchedule`, {
    params: {
      include: "manualPrices,automaticPrices",
      "fields[appPrices]": "startDate",
      "fields[appPriceTiers]": "tierNumber",
    },
  });
}

export async function fetchInAppPurchases(appId: string): Promise<unknown> {
  return ascFetch(`/v1/apps/${appId}/inAppPurchasesV2`, {
    params: {
      "fields[inAppPurchases]": "name,productId,inAppPurchaseType,state",
      limit: "50",
    },
  });
}

export async function fetchReviews(appId: string, limit = 5): Promise<unknown> {
  return ascFetch(`/v1/apps/${appId}/customerReviews`, {
    params: {
      "fields[customerReviews]": "title,body,rating,reviewerNickname,createdDate,territory",
      limit: String(limit),
      sort: "-createdDate",
    },
  });
}
