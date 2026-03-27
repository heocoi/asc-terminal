import { RevenueTicker } from "@/components/revenue-ticker";
import { AttentionPanel } from "@/components/attention-panel";
import { AppList } from "@/components/app-list";
import { TrendChart } from "@/components/trend-chart";
import { getSalesData, getAppsData, getAlerts, getRecentBadReviews, getAppStoreData, getDashboardPricing, mergeSalesWithApps } from "@/lib/data";

export default async function Dashboard() {
  const [rawSales, apps] = await Promise.all([getSalesData(30), getAppsData()]);
  const sales = mergeSalesWithApps(rawSales, apps);
  const appEntries = apps.map((a) => ({ id: a.app.id, territory: a.app.territory }));
  const [alerts, badReviews, storeData] = await Promise.all([
    Promise.resolve(getAlerts(apps, sales)),
    getRecentBadReviews(apps),
    getAppStoreData(appEntries),
  ]);

  // Lightweight pricing model per app (cached 24h)
  const pricingApps = apps.map(a => ({
    id: a.app.id,
    storePrice: storeData.meta[a.app.id]?.price ?? 0,
  }));
  const pricingModels = await getDashboardPricing(pricingApps);

  return (
    <div className="space-y-10">
      <RevenueTicker data={sales} />
      <AttentionPanel alerts={alerts} badReviews={badReviews} />
      <AppList apps={apps} sales={sales} icons={storeData.icons} ratings={storeData.ratings} pricingModels={pricingModels} />
      <TrendChart data={sales} />
    </div>
  );
}
