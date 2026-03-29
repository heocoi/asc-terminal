"use client";

import { useState, useEffect } from "react";
import type { AnalyticsSetupStatus } from "@/lib/types";

const STATUS_CONFIG = {
  not_setup: { label: "Not Setup", color: "text-text-muted bg-surface-inset" },
  pending: { label: "Pending", color: "text-warning-text bg-warning-bg" },
  active: { label: "Active", color: "text-positive-text bg-positive-bg" },
  inactive: { label: "Inactive", color: "text-negative-text bg-negative-bg" },
} as const;

export default function SettingsPage() {
  const [statuses, setStatuses] = useState<AnalyticsSetupStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStatuses(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSetup = async () => {
    setSetting(true);
    setResult(null);
    try {
      const res = await fetch("/api/analytics", { method: "POST" });
      const data = await res.json();
      setResult(data);
      // Refresh statuses
      const statusRes = await fetch("/api/analytics");
      const updated = await statusRes.json();
      if (Array.isArray(updated)) setStatuses(updated);
    } catch {
      setResult({ success: 0, failed: 1 });
    } finally {
      setSetting(false);
    }
  };

  const setupCount = statuses.filter((s) => s.hasRequest).length;
  const totalCount = statuses.length;
  const allSetup = setupCount === totalCount && totalCount > 0;

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="text-lg font-bold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Configure analytics data sources and preferences.
        </p>
      </div>

      {/* Analytics Reports Setup */}
      <div className="card rounded-xl">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-text-primary">Analytics Reports</h2>
              <p className="mt-0.5 text-xs text-text-muted">
                Enable Apple&apos;s Analytics Reports API for engagement, subscription, and commerce metrics.
                First data appears ~24-48h after setup. Data refreshes daily (T+2).
              </p>
            </div>
            {!allSetup && (
              <button
                onClick={handleSetup}
                disabled={setting || loading}
                className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-accent/90 disabled:opacity-50"
              >
                {setting ? "Setting up..." : "Enable All"}
              </button>
            )}
          </div>

          {result && (
            <div className="mt-3 rounded-lg bg-surface-inset px-3 py-2 text-xs">
              {result.success > 0 && (
                <span className="text-positive-text">{result.success} apps enabled. </span>
              )}
              {result.failed > 0 && (
                <span className="text-negative-text">{result.failed} failed. </span>
              )}
              <span className="text-text-muted">Data will be available in ~24-48 hours.</span>
            </div>
          )}
        </div>

        {/* Status per app */}
        <div className="divide-y divide-border">
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-text-muted">
              Checking analytics status...
            </div>
          ) : statuses.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-text-muted">
              No apps found. Check your ASC API credentials.
            </div>
          ) : (
            <>
              <div className="px-5 py-2.5 text-[11px] text-text-muted">
                {setupCount}/{totalCount} apps enabled
              </div>
              {statuses.map((s) => {
                const config = STATUS_CONFIG[s.status];
                return (
                  <div key={s.appId} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-text-primary">{s.appName}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Info section */}
      <div className="card rounded-xl px-5 py-4">
        <h2 className="text-sm font-bold text-text-primary">About Analytics Data</h2>
        <div className="mt-2 space-y-2 text-xs text-text-muted">
          <p>
            <strong className="text-text-secondary">Sales Reports</strong> (always on) provide daily revenue, downloads, and proceeds data.
            Available next day (T+1).
          </p>
          <p>
            <strong className="text-text-secondary">Analytics Reports</strong> (requires setup) provide engagement metrics
            (impressions, page views, conversion rate), subscription lifecycle events, and commerce details.
            Available T+2. Privacy threshold: rows with &lt;5 users are omitted.
          </p>
        </div>
      </div>
    </div>
  );
}
