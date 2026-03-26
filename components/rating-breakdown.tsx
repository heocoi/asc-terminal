"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";

export function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  const counts = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
  }
  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;

  return (
    <div className="card rounded-xl">
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="section-label">Rating</h3>
        <span className="text-[11px] text-text-muted">{total} reviews</span>
      </div>
      <div className="px-5 pb-5">
        <div className="mb-4 flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-bold text-text-primary">
            {avg.toFixed(1)}
          </span>
          <span className="text-sm text-text-muted">/ 5</span>
        </div>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = counts[star - 1];
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2.5 text-xs">
                <span className="w-3 text-right font-mono text-text-tertiary">{star}</span>
                <div className="h-1.5 flex-1 rounded-full bg-surface-inset">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${pct}%`, opacity: 0.5 + (star / 10) }}
                  />
                </div>
                <span className="w-5 text-right font-mono tabular-nums text-text-muted">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState<"all" | "negative">("all");

  if (reviews.length === 0) {
    return (
      <div className="card flex items-center justify-center rounded-xl px-5 py-12 text-sm text-text-muted">
        No reviews yet
      </div>
    );
  }

  const filtered = filter === "negative" ? reviews.filter(r => r.rating <= 2) : reviews;
  const negCount = reviews.filter(r => r.rating <= 2).length;

  return (
    <div className="card divide-y divide-border rounded-xl">
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-5 py-3">
        <div className="flex gap-0.5 rounded-lg bg-surface-inset p-0.5">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            All ({reviews.length})
          </button>
          <button
            onClick={() => setFilter("negative")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
              filter === "negative"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            1-2★ ({negCount})
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-text-muted">
          No negative reviews
        </div>
      ) : (
        filtered.map((r) => (
          <div key={r.id} className="px-5 py-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-warning-text">
                {"★".repeat(r.rating)}
                <span className="text-text-faint">{"★".repeat(5 - r.rating)}</span>
              </span>
              <span className="text-text-muted">{r.territory}</span>
              <span className="text-text-faint">·</span>
              <span className="text-text-muted">
                {new Date(r.createdDate).toLocaleDateString("en-CA")}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-text-primary">{r.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">{r.body}</p>
            <p className="mt-2 text-[11px] text-text-muted">{r.reviewerNickname}</p>
          </div>
        ))
      )}
    </div>
  );
}
