import { NextResponse } from "next/server";
import { getAppsData } from "@/lib/data";

export async function GET() {
  try {
    const statuses = await getAppsData();
    return NextResponse.json(statuses, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=1800" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch apps" },
      { status: 500 }
    );
  }
}
