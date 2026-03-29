import { gunzipSync } from "zlib";
import type { SalesRecord, DailySales } from "./types";

const DOWNLOAD_TYPES = new Set(["1", "1F", "1T", "F1"]);
const UPDATE_TYPES = new Set(["7", "7F", "7T", "F7"]);
// IAP product types: consumable, non-consumable, free subscription
const IAP_TYPES = new Set(["IA1", "IA9", "IAY", "IAC", "FI1"]);

export function parseSalesReport(gzipBuffer: Buffer): SalesRecord[] {
  const text = gunzipSync(gzipBuffer).toString("utf-8");
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t");
  const records: SalesRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split("\t");
    if (values.length < headers.length) continue;

    records.push({
      provider: values[0],
      providerCountry: values[1],
      sku: values[2],
      developer: values[3],
      title: values[4],
      version: values[5],
      productTypeIdentifier: values[6],
      units: parseFloat(values[7]) || 0,
      developerProceeds: parseFloat(values[8]) || 0,
      beginDate: values[9],
      endDate: values[10],
      customerCurrency: values[11],
      countryCode: values[12],
      currencyOfProceeds: values[13],
      appleIdentifier: values[14],
      customerPrice: parseFloat(values[15]) || 0,
      promoCode: values[16],
      parentIdentifier: values[17],
      subscription: values[18],
      period: values[19],
      category: values[20],
      cmb: values[21],
      device: values[22],
      supportedPlatforms: values[23],
      proceedsReason: values[24],
      preservedPricing: values[25],
      client: values[26],
      orderType: values[27],
    });
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
