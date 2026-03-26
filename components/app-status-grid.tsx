"use client";

import type { AppStatus } from "@/lib/types";
import Link from "next/link";

const HEALTH_COLORS = {
  green: "text-neon-green",
  yellow: "text-neon-amber",
  red: "text-neon-red",
  unknown: "text-term-dim",
};

const HEALTH_DOT = {
  green: "bg-neon-green",
  yellow: "bg-neon-amber",
  red: "bg-neon-red",
  unknown: "bg-term-dim",
};

const STATE_SHORT: Record<string, string> = {
  READY_FOR_DISTRIBUTION: "LIVE",
  READY_FOR_SALE: "LIVE",
  PROCESSING_FOR_DISTRIBUTION: "PROC",
  WAITING_FOR_REVIEW: "QUEUE",
  IN_REVIEW: "REVIEW",
  PENDING_DEVELOPER_RELEASE: "PEND",
  PREPARE_FOR_SUBMISSION: "DRAFT",
  REJECTED: "REJ",
  METADATA_REJECTED: "META_REJ",
  DEVELOPER_REJECTED: "DEV_REJ",
  REMOVED_FROM_SALE: "REMOVED",
  DEVELOPER_REMOVED_FROM_SALE: "DEV_REM",
};

export function AppStatusGrid({ apps }: { apps: AppStatus[] }) {
  const sorted = [...apps].sort((a, b) => {
    const order = { red: 0, yellow: 1, unknown: 2, green: 3 };
    return order[a.health] - order[b.health];
  });

  const counts = {
    green: apps.filter((a) => a.health === "green").length,
    yellow: apps.filter((a) => a.health === "yellow").length,
    red: apps.filter((a) => a.health === "red").length,
  };

  return (
    <div className="border border-term-border">
      <div className="flex items-center justify-between border-b border-term-border px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-widest text-term-dim">
          Apps ({apps.length})
        </span>
        <div className="flex gap-3 text-[10px]">
          <span className="text-neon-green">{counts.green} LIVE</span>
          {counts.yellow > 0 && (
            <span className="text-neon-amber">{counts.yellow} PEND</span>
          )}
          {counts.red > 0 && (
            <span className="text-neon-red">{counts.red} ERR</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((app, i) => {
          const state = app.latestVersion?.state ?? "UNKNOWN";
          const stateLabel = STATE_SHORT[state] ?? state;
          return (
            <Link
              key={app.app.id}
              href={`/app/${app.app.id}`}
              className={`flex items-center gap-2 border-b border-r border-term-border px-3 py-2 transition-colors hover:bg-term-surface ${
                i % 3 === 2 ? "border-r-0 lg:border-r-0" : ""
              }`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 ${HEALTH_DOT[app.health]}`} />
              <span className="min-w-0 flex-1 truncate text-[12px]">
                {app.app.name}
              </span>
              <span className={`shrink-0 text-[10px] ${HEALTH_COLORS[app.health]}`}>
                {stateLabel}
              </span>
              <span className="shrink-0 text-[10px] text-term-dim">
                v{app.latestVersion?.versionString ?? "?"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
