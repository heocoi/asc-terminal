"use client";

import { useState, useEffect } from "react";
import type { AlertItem, Review } from "@/lib/types";
import Link from "next/link";

const DISMISSED_KEY = "asc-dismissed-alerts";

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]"));
  } catch { return new Set(); }
}

function setDismissed(ids: Set<string>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

function alertKey(alert: AlertItem, i: number): string {
  return `alert-${alert.type}-${alert.appId ?? i}-${alert.version ?? ""}`;
}

function reviewKey(review: Review): string {
  return `review-${review.id}`;
}

const SEVERITY_BORDER = {
  red: "border-l-negative",
  amber: "border-l-warning",
  blue: "border-l-info",
};

const TYPE_LABEL: Record<string, string> = {
  rejected: "Rejected",
  in_review: "In Review",
  bad_review: "Low Rating",
  anomaly: "Anomaly",
};

const TYPE_STYLE: Record<string, string> = {
  rejected: "text-negative-text bg-negative-bg",
  in_review: "text-info-text bg-info-bg",
  bad_review: "text-warning-text bg-warning-bg",
  anomaly: "text-warning-text bg-warning-bg",
};

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className="shrink-0 rounded-md p-1 text-text-faint transition-colors hover:bg-surface-inset hover:text-text-tertiary"
      title="Dismiss"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 4L10 10M10 4L4 10" />
      </svg>
    </button>
  );
}

export function AttentionPanel({
  alerts,
  badReviews,
}: {
  alerts: AlertItem[];
  badReviews: Review[];
}) {
  const [dismissed, setDismissedState] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDismissedState(getDismissed());
    setMounted(true);
  }, []);

  const dismiss = (key: string) => {
    const next = new Set(dismissed);
    next.add(key);
    setDismissedState(next);
    setDismissed(next);
  };

  // Filter out dismissed items
  const visibleAlerts = alerts.filter((a, i) => !dismissed.has(alertKey(a, i)));
  const visibleReviews = badReviews.filter((r) => !dismissed.has(reviewKey(r)));
  const totalVisible = visibleAlerts.length + visibleReviews.length;
  const totalDismissed = (alerts.length + badReviews.length) - totalVisible;

  if (!mounted) return null;
  if (totalVisible === 0 && totalDismissed === 0) return null;

  return (
    <div className="animate-fade-up space-y-2" style={{ animationDelay: "0.06s" }}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="section-label">Needs attention</h2>
          {totalVisible > 0 && (
            <span className="rounded-full bg-negative-bg px-2 py-0.5 text-[10px] font-bold tabular-nums text-negative-text">
              {totalVisible}
            </span>
          )}
        </div>
        {totalDismissed > 0 && (
          <button
            onClick={() => { setDismissedState(new Set()); setDismissed(new Set()); }}
            className="text-[11px] font-medium text-text-muted transition-colors hover:text-text-secondary"
          >
            Show {totalDismissed} dismissed
          </button>
        )}
      </div>

      {totalVisible === 0 && totalDismissed > 0 && (
        <p className="py-2 text-xs text-text-muted">All clear. {totalDismissed} dismissed.</p>
      )}

      {/* Alert items */}
      {visibleAlerts.map((alert, i) => {
        const key = alertKey(alert, i);
        const borderColor = SEVERITY_BORDER[alert.severity];
        const label = TYPE_LABEL[alert.type] ?? alert.type;
        const badgeStyle = TYPE_STYLE[alert.type] ?? "text-text-muted bg-surface-inset";
        const isClickable = !!alert.appId;

        const content = (
          <div className={`card flex items-center gap-4 rounded-xl border-l-[3px] ${borderColor} px-4 py-3 transition-all ${
            isClickable ? "hover:border-l-[4px] hover:shadow-sm cursor-pointer" : ""
          }`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${badgeStyle}`}>
                  {label}
                </span>
                <span className={`truncate text-sm font-semibold ${isClickable ? "text-text-primary" : "text-text-primary"}`}>
                  {alert.title}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-text-tertiary">{alert.detail}</p>
            </div>
            <DismissButton onClick={() => dismiss(key)} />
          </div>
        );

        if (isClickable) {
          return (
            <Link key={key} href={`/app/${alert.appId}`} className="group block">
              {content}
            </Link>
          );
        }
        return <div key={key}>{content}</div>;
      })}

      {/* Bad reviews */}
      {visibleReviews.map((review) => {
        const key = reviewKey(review);
        return (
          <Link key={key} href={`/app/${review.appId}`} className="group block">
            <div className="card flex items-center gap-4 rounded-xl border-l-[3px] border-l-warning px-4 py-3 transition-all hover:border-l-[4px] hover:shadow-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 rounded-md bg-warning-bg px-1.5 py-0.5 text-[10px] font-semibold text-warning-text">
                    {review.rating}★ Review
                  </span>
                  <span className="truncate text-sm font-semibold text-text-primary">
                    {review.appName}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-text-tertiary">{review.title}</p>
              </div>
              <DismissButton onClick={() => dismiss(key)} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
