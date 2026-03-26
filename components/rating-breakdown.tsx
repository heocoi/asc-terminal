"use client";

import type { Review } from "@/lib/types";

export function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
  }
  const total = reviews.length;
  const avg = total > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / total
    : 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-baseline gap-2">
        <h3 className="text-sm font-medium text-zinc-400">Ratings</h3>
        <span className="text-lg font-semibold">{avg.toFixed(1)}</span>
        <span className="text-xs text-zinc-500">({total} reviews)</span>
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star - 1];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-zinc-500">{star}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-6 text-right text-zinc-500">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-zinc-500">No reviews yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div
          key={r.id}
          className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-amber-500">
              {"★".repeat(r.rating)}
              {"☆".repeat(5 - r.rating)}
            </span>
            <span className="text-xs text-zinc-500">{r.territory}</span>
          </div>
          <p className="mt-1 text-sm font-medium">{r.title}</p>
          <p className="mt-0.5 text-sm text-zinc-400">{r.body}</p>
          <p className="mt-1 text-xs text-zinc-600">
            {r.reviewerNickname} · {new Date(r.createdDate).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
