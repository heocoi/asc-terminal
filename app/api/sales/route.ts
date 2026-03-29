import { NextResponse } from "next/server";
import { getSalesData } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(parseInt(searchParams.get("days") || "30", 10) || 30, 1), 90);

  try {
    const results = await getSalesData(days);
    return NextResponse.json(results, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=1800" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sales" },
      { status: 500 }
    );
  }
}
