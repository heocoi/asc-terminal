import { RevenueTicker } from "@/components/revenue-ticker";
import { AttentionPanel } from "@/components/attention-panel";
import { AppList } from "@/components/app-list";
import { RevenueChart } from "@/components/revenue-chart";
import { DownloadsChart } from "@/components/downloads-chart";
import { getSalesData, getAppsData, getAlerts, getRecentBadReviews, getAppStoreData, mergeSalesWithApps } from "@/lib/data";

export default async function Dashboard() {
  const [rawSales, apps] = await Promise.all([getSalesData(30), getAppsData()]);
  const sales = mergeSalesWithApps(rawSales, apps);
  const appEntries = apps.map((a) => ({ id: a.app.id, territory: a.app.territory }));
  const [alerts, badReviews, storeData] = await Promise.all([
    Promise.resolve(getAlerts(apps, sales)),
    getRecentBadReviews(apps),
    getAppStoreData(appEntries),
  ]);

  return (
    <div className="space-y-10">
      {/* Q1: Revenue hero - the 5-second glance */}
      <RevenueTicker data={sales} />

      {/* Q2: What needs attention? */}
      <AttentionPanel alerts={alerts} badReviews={badReviews} />

      {/* Q3: Portfolio overview */}
      <AppList apps={apps} sales={sales} icons={storeData.icons} ratings={storeData.ratings} />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart data={sales} />
        <DownloadsChart data={sales} />
      </div>
    </div>
  );
}
