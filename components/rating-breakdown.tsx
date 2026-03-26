"use client";

import type { Review } from "@/lib/types";

export function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  const counts = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
  }
  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;

  return (
    <div className="border border-term-border">
      <div className="flex items-center justify-between border-b border-term-border px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-widest text-term-dim">Ratings</span>
        <span className="text-[10px] text-term-dim">{total} reviews</span>
      </div>
      <div className="px-3 py-3">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-neon-amber">
            {avg.toFixed(1)}
          </span>
          <span className="text-[10px] text-term-dim">/ 5.0</span>
        </div>
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = counts[star - 1];
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-[11px]">
                <span className="w-3 text-term-dim">{star}</span>
                <div className="h-1.5 flex-1 bg-term-border">
                  <div
                    className="h-full bg-neon-amber"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-5 text-right tabular-nums text-term-dim">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="border border-term-border px-3 py-6 text-center text-[11px] text-term-dim">
        NO REVIEWS
      </div>
    );
  }

  return (
    <div className="border border-term-border">
      {reviews.map((r, i) => (
        <div
          key={r.id}
          className={`px-3 py-2 ${i > 0 ? "border-t border-term-border" : ""}`}
        >
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-neon-amber">
              {"★".repeat(r.rating)}
              <span className="text-term-muted">{"★".repeat(5 - r.rating)}</span>
            </span>
            <span className="text-term-dim">{r.territory}</span>
            <span className="text-term-muted">
              {new Date(r.createdDate).toLocaleDateString("en-CA")}
            </span>
          </div>
          <p className="mt-1 text-[12px] font-medium text-term-text">{r.title}</p>
          <p className="mt-0.5 text-[11px] text-term-dim leading-relaxed">{r.body}</p>
          <p className="mt-1 text-[10px] text-term-muted">{r.reviewerNickname}</p>
        </div>
      ))}
    </div>
  );
}
