import { SummaryCards } from "@/components/summary-cards";
import { RevenueChart } from "@/components/revenue-chart";
import { DownloadsChart } from "@/components/downloads-chart";
import { AppStatusGrid } from "@/components/app-status-grid";
import { getSalesData, getAppsData } from "@/lib/data";

export default async function Dashboard() {
  const [sales, apps] = await Promise.all([getSalesData(30), getAppsData()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ASC Dashboard</h1>
        <p className="text-xs text-zinc-500">
          {apps.length} apps · Data up to{" "}
          {sales.length > 0 ? sales[sales.length - 1].date : "N/A"}
        </p>
      </div>

      <SummaryCards data={sales} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueChart data={sales} />
        <DownloadsChart data={sales} />
      </div>

      <AppStatusGrid apps={apps} />
    </div>
  );
}
