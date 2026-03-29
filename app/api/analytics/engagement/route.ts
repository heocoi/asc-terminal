import { NextResponse } from "next/server";
import { getAppsData, getEngagementData } from "@/lib/data";

// GET: Fetch engagement summary (impressions, conversion rate) for all apps
export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") ?? "30", 10) || 30, 1), 90);

  try {
    const apps = await getAppsData();
    const summaries: Record<string, { impressions: number; pageViews: number; conversionRate: number }> = {};

    // getEngagementData internally checks for ONGOING requests - returns [] if none
    for (let i = 0; i < apps.length; i += 5) {
      const batch = apps.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (app) => {
          const data = await getEngagementData(app.app.id, days);
          if (data.length === 0) return null;

          const impressions = data.reduce((s, d) => s + d.impressions, 0);
          const pageViews = data.reduce((s, d) => s + d.pageViews, 0);
          const conversionRate = impressions > 0
            ? data.reduce((s, d) => s + d.conversionRate, 0) / data.length
            : 0;

          return { appId: app.app.id, impressions, pageViews, conversionRate };
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          summaries[r.value.appId] = {
            impressions: r.value.impressions,
            pageViews: r.value.pageViews,
            conversionRate: r.value.conversionRate,
          };
        }
      }
    }

    return NextResponse.json(summaries, {
      headers: { "Cache-Control": "s-maxage=21600, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}
