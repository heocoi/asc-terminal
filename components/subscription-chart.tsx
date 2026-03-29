"use client";

import { useState } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ComposedChart, Bar,
} from "recharts";
import type { SubscriptionStateMetrics, SubscriptionEventMetrics } from "@/lib/types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(d: string) {
  const [, m, day] = d.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(day, 10)}`;
}

type View = "state" | "events";

function StateTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2.5 shadow-sm">
      <p className="mb-1.5 text-[10px] font-semibold text-text-muted">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs leading-5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="flex-1 text-text-secondary">{entry.name}</span>
          <span className="font-mono font-semibold tabular-nums text-text-primary">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function SubscriptionChart({
  stateData,
  eventData,
}: {
  stateData: SubscriptionStateMetrics[];
  eventData: SubscriptionEventMetrics[];
}) {
  const [view, setView] = useState<View>("state");

  if (stateData.length === 0 && eventData.length === 0) return null;

  const stateChartData = stateData.map((d) => ({
    date: fmtDate(d.date),
    "Active Paid": d.activePaid,
    "Free Trial": d.activeFreeTrial,
    "Billing Issue": d.billingIssue,
  }));

  const eventChartData = eventData.map((d) => ({
    date: fmtDate(d.date),
    "Trial Starts": d.trialStarts,
    "Conversions": d.trialConversions,
    "Renewals": d.renewals,
    "Churns": d.voluntaryChurns + d.involuntaryChurns,
  }));

  return (
    <div className="card animate-fade-up rounded-xl" style={{ animationDelay: "0.18s" }}>
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="section-label">Subscription Trends</h3>
        <div className="flex gap-0.5 rounded-lg bg-surface-inset p-0.5">
          <button
            onClick={() => setView("state")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
              view === "state"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Active Subs
          </button>
          <button
            onClick={() => setView("events")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
              view === "events"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Events
          </button>
        </div>
      </div>

      <div className="px-3 pb-4">
        <ResponsiveContainer width="100%" height={200}>
          {view === "state" ? (
            <AreaChart data={stateChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#B0AAA2" }} />
              <YAxis stroke="transparent" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#B0AAA2" }} width={35} allowDecimals={false} />
              <Tooltip content={<StateTooltip />} />
              <Area type="monotone" dataKey="Active Paid" stackId="1" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.12} strokeWidth={1.5} />
              <Area type="monotone" dataKey="Free Trial" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.08} strokeWidth={1.5} />
              {stateChartData.some((d) => d["Billing Issue"] > 0) && (
                <Area type="monotone" dataKey="Billing Issue" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.08} strokeWidth={1.5} />
              )}
            </AreaChart>
          ) : (
            <ComposedChart data={eventChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="transparent" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#B0AAA2" }} />
              <YAxis stroke="transparent" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#B0AAA2" }} width={35} allowDecimals={false} />
              <Tooltip content={<StateTooltip />} />
              <Bar dataKey="Trial Starts" fill="#10B981" opacity={0.6} radius={[2, 2, 0, 0]} />
              <Bar dataKey="Conversions" fill="#4F46E5" opacity={0.6} radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="Renewals" stroke="#0EA5E9" strokeWidth={1.5} dot={false} />
              {eventChartData.some((d) => d["Churns"] > 0) && (
                <Line type="monotone" dataKey="Churns" stroke="#EC4899" strokeWidth={1.5} dot={false} />
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-5 py-3">
        {view === "state" ? (
          <>
            <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
              <span className="inline-block h-2 w-2 rounded-full bg-[#4F46E5]" /> Active Paid
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
              <span className="inline-block h-2 w-2 rounded-full bg-[#10B981]" /> Free Trial
            </span>
            {stateChartData.some((d) => d["Billing Issue"] > 0) && (
              <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                <span className="inline-block h-2 w-2 rounded-full bg-[#F59E0B]" /> Billing Issue
              </span>
            )}
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
              <span className="inline-block h-2 w-2 rounded-full bg-[#10B981]" /> Trial Starts
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
              <span className="inline-block h-2 w-2 rounded-full bg-[#4F46E5]" /> Conversions
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
              <span className="inline-block h-2 w-2 rounded-full bg-[#0EA5E9]" /> Renewals
            </span>
            {eventChartData.some((d) => d["Churns"] > 0) && (
              <span className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                <span className="inline-block h-2 w-2 rounded-full bg-[#EC4899]" /> Churns
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
