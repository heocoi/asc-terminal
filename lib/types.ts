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

export interface DailySales {
  date: string;
  apps: Record<
    string,
    {
      title: string;
      downloads: number;
      updates: number;
      revenue: number;
      proceeds: number;
    }
  >;
  totalDownloads: number;
  totalRevenue: number;
  totalProceeds: number;
}

export interface AppInfo {
  id: string;
  name: string;
  bundleId: string;
  sku: string;
  primaryLocale: string;
  platformDisplay: string;
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
}
