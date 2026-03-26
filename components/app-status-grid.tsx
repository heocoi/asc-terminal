"use client";

import type { AppStatus } from "@/lib/types";
import Link from "next/link";

const HEALTH_COLORS = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
  unknown: "bg-zinc-600",
};

const STATE_LABELS: Record<string, string> = {
  READY_FOR_DISTRIBUTION: "Live",
  READY_FOR_SALE: "Live",
  PROCESSING_FOR_DISTRIBUTION: "Processing",
  WAITING_FOR_REVIEW: "In Review Queue",
  IN_REVIEW: "In Review",
  PENDING_DEVELOPER_RELEASE: "Pending Release",
  PREPARE_FOR_SUBMISSION: "Draft",
  REJECTED: "Rejected",
  METADATA_REJECTED: "Metadata Rejected",
  DEVELOPER_REJECTED: "Dev Rejected",
  REMOVED_FROM_SALE: "Removed",
  DEVELOPER_REMOVED_FROM_SALE: "Removed by Dev",
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
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-400">App Status</h3>
        <div className="flex gap-3 text-xs text-zinc-500">
          <span>{counts.green} live</span>
          {counts.yellow > 0 && (
            <span className="text-amber-500">{counts.yellow} pending</span>
          )}
          {counts.red > 0 && (
            <span className="text-red-500">{counts.red} issues</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((app) => (
          <Link
            key={app.app.id}
            href={`/app/${app.app.id}`}
            className="flex items-center gap-3 rounded-lg border border-zinc-800 px-3 py-2 transition hover:border-zinc-700 hover:bg-zinc-800/50"
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${HEALTH_COLORS[app.health]}`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{app.app.name}</p>
              <p className="text-xs text-zinc-500">
                v{app.latestVersion?.versionString ?? "?"} ·{" "}
                {STATE_LABELS[app.latestVersion?.state ?? ""] ??
                  app.latestVersion?.state ??
                  "Unknown"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
