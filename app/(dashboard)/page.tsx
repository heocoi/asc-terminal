import { RevenueTicker } from "@/components/revenue-ticker";
import { AttentionPanel } from "@/components/attention-panel";
import { AppList } from "@/components/app-list";
import { TrendChart } from "@/components/trend-chart";
import { SubscriptionSummary } from "@/components/subscription-summary";
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
      {/* Q1: "How much did I make?" - 5-sec glance */}
      <RevenueTicker data={sales} />

      {/* Q2: "What needs attention?" - actionable alerts */}
      <AttentionPanel alerts={alerts} badReviews={badReviews} />

      {/* Q3: "What's the trend?" - pattern recognition */}
      <TrendChart data={sales} />

      {/* Q4: "How's each app?" - drill-down */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AppList apps={apps} sales={sales} icons={storeData.icons} ratings={storeData.ratings} pricingModels={pricingModels} />
        </div>
        <div>
          <SubscriptionSummary sales={sales} />
        </div>
      </div>
    </div>
  );
}
