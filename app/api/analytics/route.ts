import { NextResponse } from "next/server";
import { getAppsData, getAnalyticsSetupStatus, setupAnalytics } from "@/lib/data";

// GET: Check analytics setup status for all apps
export async function GET() {
  try {
    const apps = await getAppsData();
    const statuses = await getAnalyticsSetupStatus(apps);
    return NextResponse.json(statuses, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check analytics status" },
      { status: 500 }
    );
  }
}

// POST: Create ONGOING report requests for all apps
export async function POST() {
  try {
    const apps = await getAppsData();
    const result = await setupAnalytics(apps);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to setup analytics" },
      { status: 500 }
    );
  }
}
