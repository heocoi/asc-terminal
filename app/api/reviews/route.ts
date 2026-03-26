import { NextResponse } from "next/server";
import { fetchReviews } from "@/lib/asc-client";
import type { Review } from "@/lib/types";

interface ASCReviewData {
  id: string;
  attributes: {
    title: string;
    body: string;
    rating: number;
    reviewerNickname: string;
    createdDate: string;
    territory: string;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get("appId");
  if (!appId) {
    return NextResponse.json({ error: "appId required" }, { status: 400 });
  }

  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  const res = (await fetchReviews(appId, limit)) as { data: ASCReviewData[] };

  const reviews: Review[] = (res.data || []).map((r) => ({
    id: r.id,
    title: r.attributes.title,
    body: r.attributes.body,
    rating: r.attributes.rating,
    reviewerNickname: r.attributes.reviewerNickname,
    createdDate: r.attributes.createdDate,
    territory: r.attributes.territory,
  }));

  return NextResponse.json(reviews, {
    headers: {
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=1800",
    },
  });
}
