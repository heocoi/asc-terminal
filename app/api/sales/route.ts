import { NextResponse } from "next/server";
import { fetchSalesReport } from "@/lib/asc-client";
import { parseSalesReport, aggregateSales } from "@/lib/sales-parser";
import type { DailySales } from "@/lib/types";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

async function fetchDaySales(date: string): Promise<DailySales | null> {
  try {
    const res = await fetchSalesReport(date);
    if (res.status === 404) return null; // No data for this date
    if (!res.ok) {
      console.error(`Sales report ${date}: ${res.status}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const records = parseSalesReport(buffer);
    return aggregateSales(records, date);
  } catch (e) {
    console.error(`Failed to fetch sales for ${date}:`, e);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "30"), 90);

  const results: DailySales[] = [];
  const today = new Date();

  // Fetch in batches of 5 to respect rate limits
  for (let batch = 0; batch < days; batch += 5) {
    const promises: Promise<DailySales | null>[] = [];
    for (let i = batch; i < Math.min(batch + 5, days); i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i - 1); // T+1 delay, start from yesterday
      promises.push(fetchDaySales(formatDate(d)));
    }
    const batchResults = await Promise.all(promises);
    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }

  results.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=1800",
    },
  });
}
