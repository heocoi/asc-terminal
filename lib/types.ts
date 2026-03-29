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
  iapRevenue: number; // subset of proceeds: IAP-only portion
  subscriptionRevenue: number; // subset of proceeds: subscription-only portion
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
  totalSubscriptionRevenue: number; // subset of totalProceeds, not additive
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

// Analytics Reports API types
export interface AnalyticsReportRequest {
  id: string;
  accessType: "ONGOING" | "ONE_TIME_SNAPSHOT";
  stoppedDueToInactivity: boolean;
}

export interface AnalyticsReportMeta {
  category: string;
  name: string;
}

export interface AnalyticsReportInstance {
  id: string;
  granularity: string;
  processingDate: string;
}

export interface AnalyticsSegment {
  id: string;
  url: string;
  checksum: string;
}

// Report categories
export type AnalyticsCategory =
  | "APP_STORE_ENGAGEMENT"
  | "APP_STORE_COMMERCE"
  | "APP_USAGE"
  | "SUBSCRIPTION_EVENT"
  | "SUBSCRIPTION_STATE";

// Parsed metrics from analytics reports
export interface EngagementMetrics {
  date: string;
  impressions: number;
  impressionsUnique: number;
  pageViews: number;
  pageViewsUnique: number;
  conversionRate: number; // downloads / impressions
}

export interface CommerceMetrics {
  date: string;
  totalDownloads: number;
  proceeds: number;
  payingUsers: number;
  refunds: number;
}

export interface SubscriptionEventMetrics {
  date: string;
  trialStarts: number;
  trialConversions: number;
  paidStarts: number;
  renewals: number;
  voluntaryChurns: number;
  involuntaryChurns: number;
  billingIssueEntries: number;
  gracePeriodRecoveries: number;
}

export interface SubscriptionStateMetrics {
  date: string;
  activePaid: number;
  activeFreeTrial: number;
  activePaidOffer: number;
  billingIssue: number;
  mrr: number;
}

export interface UsageMetricsData {
  date: string;
  sessions: number;
  crashes: number;
  activeDevices: number;
  installations: number;
  deletions: number;
}

// Setup status per app
export interface AnalyticsSetupStatus {
  appId: string;
  appName: string;
  hasRequest: boolean;
  requestId?: string;
  status: "not_setup" | "pending" | "active" | "inactive";
}

export interface AlertItem {
  type: "rejected" | "in_review" | "in_queue" | "bad_review" | "anomaly";
  severity: "red" | "amber" | "blue";
  title: string;
  detail: string;
  appId?: string;
  appName?: string;
  version?: string;
  timestamp?: string;
}
