"use client";

interface UsageData {
  sessions: number;
  crashes: number;
  activeDevices: number;
  installations: number;
  deletions: number;
}

export function UsageMetrics({ data }: { data: UsageData }) {
  const { sessions, crashes, activeDevices, installations, deletions } = data;
  const crashRate = sessions > 0 ? (crashes / sessions) * 100 : 0;
  const netInstalls = installations - deletions;

  return (
    <div className="animate-fade-up space-y-3" style={{ animationDelay: "0.20s" }}>
      <div className="flex items-center gap-2">
        <h3 className="section-label">App Usage</h3>
        <span className="rounded-md bg-surface-inset px-1.5 py-0.5 text-[9px] font-medium text-text-muted">
          Opt-in data
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card rounded-xl px-5 py-4">
          <p className="section-label">Sessions</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
            {sessions.toLocaleString()}
          </p>
        </div>
        <div className="card rounded-xl px-5 py-4">
          <p className="section-label">Active Devices</p>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-text-primary">
            {activeDevices.toLocaleString()}
          </p>
        </div>
        {crashes > 0 && (
          <div className="card rounded-xl px-5 py-4">
            <p className="section-label">Crashes</p>
            <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-negative-text">
              {crashes.toLocaleString()}
            </p>
            {crashRate > 0 && (
              <p className="mt-1 text-[11px] text-text-muted">
                {crashRate.toFixed(2)}% crash rate
              </p>
            )}
          </div>
        )}
        {netInstalls !== 0 && (
          <div className="card rounded-xl px-5 py-4">
            <p className="section-label">Net Installs</p>
            <p className={`mt-2 font-mono text-2xl font-bold tabular-nums ${netInstalls >= 0 ? "text-positive-text" : "text-negative-text"}`}>
              {netInstalls >= 0 ? "+" : ""}{netInstalls.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] text-text-muted">
              {installations} installed, {deletions} deleted
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
