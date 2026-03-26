import { SummaryCards } from "@/components/summary-cards";
import { RevenueChart } from "@/components/revenue-chart";
import { DownloadsChart } from "@/components/downloads-chart";
import { AppStatusGrid } from "@/components/app-status-grid";
import { getSalesData, getAppsData } from "@/lib/data";

export default async function Dashboard() {
  const [sales, apps] = await Promise.all([getSalesData(30), getAppsData()]);

  const lastDate = sales.length > 0 ? sales[sales.length - 1].date : "N/A";

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between border border-term-border px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="bg-neon-green px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">
            ASC
          </span>
          <span className="text-sm font-semibold">Terminal</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-term-dim">
          <span>{apps.length} apps</span>
          <span>data thru {lastDate}</span>
          <span className="text-neon-green">● LIVE</span>
        </div>
      </div>

      {/* Summary */}
      <SummaryCards data={sales} />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <RevenueChart data={sales} />
        <DownloadsChart data={sales} />
      </div>

      {/* App Status */}
      <AppStatusGrid apps={apps} />

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-term-muted">
        <span>ASC Terminal v0.1.0</span>
        <span>cache: 1h · source: App Store Connect API</span>
      </div>
    </div>
  );
}
