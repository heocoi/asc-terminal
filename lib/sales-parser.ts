import { gunzipSync } from "zlib";
import type { SalesRecord, DailySales } from "./types";

const DOWNLOAD_TYPES = new Set(["1", "1F", "1T", "F1"]);
const UPDATE_TYPES = new Set(["7", "7F", "7T", "F7"]);
// IAP product types: consumable, non-consumable, free subscription
const IAP_TYPES = new Set(["IA1", "IA9", "IAY", "IAC", "FI1"]);

// Map header names to SalesRecord fields (Apple may reorder columns)
const HEADER_MAP: Record<string, keyof SalesRecord> = {
  "Provider": "provider",
  "Provider Country": "providerCountry",
  "SKU": "sku",
  "Developer": "developer",
  "Title": "title",
  "Version": "version",
  "Product Type Identifier": "productTypeIdentifier",
  "Units": "units",
  "Developer Proceeds": "developerProceeds",
  "Begin Date": "beginDate",
  "End Date": "endDate",
  "Customer Currency": "customerCurrency",
  "Country Code": "countryCode",
  "Currency of Proceeds": "currencyOfProceeds",
  "Apple Identifier": "appleIdentifier",
  "Customer Price": "customerPrice",
  "Promo Code": "promoCode",
  "Parent Identifier": "parentIdentifier",
  "Subscription": "subscription",
  "Period": "period",
  "Category": "category",
  "CMB": "cmb",
  "Device": "device",
  "Supported Platforms": "supportedPlatforms",
  "Proceeds Reason": "proceedsReason",
  "Preserved Pricing": "preservedPricing",
  "Client": "client",
  "Order Type": "orderType",
};

const NUM_FIELDS = new Set<keyof SalesRecord>(["units", "developerProceeds", "customerPrice"]);

export function parseSalesReport(gzipBuffer: Buffer): SalesRecord[] {
  const text = gunzipSync(gzipBuffer).toString("utf-8");
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t").map(h => h.trim());
  const colMap: { field: keyof SalesRecord; index: number }[] = [];
  for (let i = 0; i < headers.length; i++) {
    const field = HEADER_MAP[headers[i]];
    if (field) colMap.push({ field, index: i });
  }

  const records: SalesRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split("\t");
    if (values.length < colMap.length) continue;

    const record = {} as Record<keyof SalesRecord, string | number>;
    for (const { field, index } of colMap) {
      const raw = values[index] ?? "";
      record[field] = NUM_FIELDS.has(field) ? (parseFloat(raw) || 0) : raw;
    }
    records.push(record as unknown as SalesRecord);
  }

  return records;
}

export function aggregateSales(records: SalesRecord[], date: string): DailySales {
  const apps: DailySales["apps"] = {};
  let totalDownloads = 0;
  let totalRevenue = 0;
  let totalProceeds = 0;
  let totalRefunds = 0;
  let totalSubscriptionRevenue = 0;

  for (const r of records) {
    const key = r.appleIdentifier;
    if (!apps[key]) {
      apps[key] = { title: r.title, downloads: 0, updates: 0, revenue: 0, proceeds: 0, iapRevenue: 0, subscriptionRevenue: 0, refunds: 0, parentSku: r.parentIdentifier?.trim() || "", countries: {} };
    }

    const entry = apps[key];
    const isDownload = DOWNLOAD_TYPES.has(r.productTypeIdentifier);
    const isUpdate = UPDATE_TYPES.has(r.productTypeIdentifier);
    const isIAP = IAP_TYPES.has(r.productTypeIdentifier);
    const isRefund = r.units < 0;

    if (isDownload) {
      entry.downloads += r.units;
      totalDownloads += r.units;
    } else if (isUpdate) {
      entry.updates += r.units;
    }

    const proceeds = r.developerProceeds * r.units;
    const revenue = r.customerPrice * r.units;
    entry.revenue += revenue;
    entry.proceeds += proceeds;
    totalRevenue += revenue;
    totalProceeds += proceeds;

    // Track refunds (negative units = refund, store absolute value)
    if (isRefund) {
      const refundAmount = Math.abs(proceeds);
      entry.refunds += refundAmount;
      totalRefunds += refundAmount;
    }

    // Track subscription revenue (subscription field = "Renewal" for auto-renewable)
    if (r.subscription && r.subscription.trim() !== "") {
      const subProceeds = Math.max(0, proceeds);
      entry.subscriptionRevenue += subProceeds;
      totalSubscriptionRevenue += subProceeds;
    } else if (isIAP) {
      // Non-subscription IAP revenue
      entry.iapRevenue += Math.max(0, proceeds);
    }

    // Track per-country
    const cc = r.countryCode || "??";
    if (!entry.countries![cc]) entry.countries![cc] = { proceeds: 0, downloads: 0 };
    entry.countries![cc].proceeds += proceeds;
    if (isDownload) entry.countries![cc].downloads += r.units;
  }

  return { date, apps, totalDownloads, totalRevenue, totalProceeds, totalRefunds, totalSubscriptionRevenue };
}
