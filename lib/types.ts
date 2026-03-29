export interface SalesRecord {
  provider: string;
  providerCountry: string;
  sku: string;
  developer: string;
  title: string;
  version: string;
  productTypeIdentifier: string;
  units: number;
  developerProceeds: number;
  beginDate: string;
  endDate: string;
  customerCurrency: string;
  countryCode: string;
  currencyOfProceeds: string;
  appleIdentifier: string;
  customerPrice: number;
  promoCode: string;
  parentIdentifier: string;
  subscription: string;
  period: string;
  category: string;
  cmb: string;
  device: string;
  supportedPlatforms: string;
  proceedsReason: string;
  preservedPricing: string;
  client: string;
  orderType: string;
}

export interface AppDaySales {
  title: string;
  downloads: number;
  updates: number;
  revenue: number;
  proceeds: number;
  iapRevenue: number;
  subscriptionRevenue: number;
  refunds: number; // absolute value of refunded proceeds
  parentSku?: string;
  customerPrice?: number; // base app price from most recent download transaction
  customerCurrency?: string;
  countries?: Record<string, { proceeds: number; downloads: number }>;
}

export interface DailySales {
  date: string;
  apps: Record<string, AppDaySales>;
  totalDownloads: number;
  totalRevenue: number;
  totalProceeds: number;
  totalRefunds: number;
  totalSubscriptionRevenue: number;
}

export interface AppInfo {
  id: string;
  name: string;
  bundleId: string;
  sku: string;
  primaryLocale: string;
  platformDisplay: string;
  territory: string; // ISO 3166-1 alpha-3 from ASC (e.g. "USA", "VNM")
}

export interface AppVersion {
  id: string;
  versionString: string;
  state: string;
  platform: string;
  createdDate: string;
}

export interface AppStatus {
  app: AppInfo;
  latestVersion: AppVersion | null;
  health: "green" | "yellow" | "red" | "unknown";
}

export interface Review {
  id: string;
  title: string;
  body: string;
  rating: number;
  reviewerNickname: string;
  createdDate: string;
  territory: string;
  appName?: string;
  appId?: string;
}

export type AppIcons = Record<string, string>; // appId -> icon URL

export type AppRatings = Record<string, { avg: number; count: number }>; // appId -> rating info

export interface AppStoreMeta {
  price: number;
  formattedPrice: string;
  genre: string;
  releaseDate: string;
  storeUrl: string;
}
export type AppStoreMetaMap = Record<string, AppStoreMeta>;

export interface SubscriptionInfo {
  name: string;
  price: number;
  productId: string;
}

export interface AppPricingModel {
  basePrice: string;
  hasIAP: boolean;
  hasSubscription: boolean;
  iapCount: number;
  subscriptionCount: number;
  minIAPPrice: number | null;
  subscriptions: SubscriptionInfo[];
  model: string;
}

export interface AlertItem {
  type: "rejected" | "in_review" | "bad_review" | "anomaly";
  severity: "red" | "amber" | "blue";
  title: string;
  detail: string;
  appId?: string;
  appName?: string;
  version?: string;
  timestamp?: string;
}
