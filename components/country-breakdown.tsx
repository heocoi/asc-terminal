"use client";

import type { DailySales } from "@/lib/types";

// ISO 3166-1 alpha-2 -> country name (common App Store countries)
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  JP: "Japan", DE: "Germany", FR: "France", KR: "South Korea",
  CN: "China", TW: "Taiwan", VN: "Vietnam", IN: "India",
  BR: "Brazil", MX: "Mexico", IT: "Italy", ES: "Spain",
  NL: "Netherlands", SE: "Sweden", NO: "Norway", DK: "Denmark",
  CH: "Switzerland", RU: "Russia", TH: "Thailand", SG: "Singapore",
  MY: "Malaysia", ID: "Indonesia", PH: "Philippines", SA: "Saudi Arabia",
  AE: "UAE", TR: "Turkey", PL: "Poland", NZ: "New Zealand",
  ZA: "South Africa", IE: "Ireland", AT: "Austria", BE: "Belgium",
  PT: "Portugal", HK: "Hong Kong", FI: "Finland", CZ: "Czechia",
  IL: "Israel", AR: "Argentina", CO: "Colombia", CL: "Chile",
  AO: "Angola", RO: "Romania", HU: "Hungary", GR: "Greece",
  EG: "Egypt", NG: "Nigeria", KE: "Kenya", PK: "Pakistan",
  BD: "Bangladesh", UA: "Ukraine", PE: "Peru",
};

interface CountryData {
  code: string;
  name: string;
  proceeds: number;
  downloads: number;
}

export function CountryBreakdown({ sales, appId }: { sales: DailySales[]; appId: string }) {
  const countryMap: Record<string, { proceeds: number; downloads: number }> = {};

  for (const day of sales) {
    const appData = day.apps[appId];
    if (!appData?.countries) continue;
    for (const [cc, data] of Object.entries(appData.countries)) {
      if (!countryMap[cc]) countryMap[cc] = { proceeds: 0, downloads: 0 };
      countryMap[cc].proceeds += data.proceeds;
      countryMap[cc].downloads += data.downloads;
    }
  }

  const countries: CountryData[] = Object.entries(countryMap)
    .map(([code, data]) => ({
      code,
      name: COUNTRY_NAMES[code] ?? code,
      ...data,
    }))
    .filter(c => c.proceeds > 0 || c.downloads > 0)
    .sort((a, b) => b.proceeds - a.proceeds || b.downloads - a.downloads);

  if (countries.length === 0) return null;

  const top5 = countries.slice(0, 5);
  const totalProceeds = countries.reduce((s, c) => s + c.proceeds, 0);
  const totalDownloads = countries.reduce((s, c) => s + c.downloads, 0);
  const maxProceeds = Math.max(...top5.map(c => c.proceeds), 1);

  return (
    <div className="card rounded-xl">
      <div className="px-5 py-4">
        <h3 className="section-label">Top Markets</h3>
      </div>
      <div className="space-y-1 px-5 pb-4">
        {top5.map((c) => {
          const pct = totalProceeds > 0 ? (c.proceeds / totalProceeds) * 100 : 0;
          const barWidth = (c.proceeds / maxProceeds) * 100;

          return (
            <div key={c.code} className="group relative">
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-accent-subtle transition-all group-hover:bg-accent/8"
                style={{ width: `${barWidth}%` }}
              />
              <div className="relative flex items-center gap-3 rounded-md px-3 py-2">
                <span className={`fi fi-${c.code.toLowerCase()}`} style={{ fontSize: "12px", borderRadius: "2px", overflow: "hidden" }} />
                <span className="flex-1 text-xs font-medium text-text-primary">{c.name}</span>
                <span className="font-mono text-xs tabular-nums text-text-secondary">
                  {c.proceeds > 0 ? `$${c.proceeds.toFixed(2)}` : ""}
                </span>
                <span className="w-10 text-right font-mono text-[11px] tabular-nums text-text-muted">
                  {c.downloads > 0 ? `${c.downloads}` : ""}
                </span>
                <span className="w-10 text-right text-[11px] tabular-nums text-text-muted">
                  {pct > 0 ? `${pct.toFixed(0)}%` : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {countries.length > 5 && (
        <div className="border-t border-border px-5 py-2.5 text-[11px] text-text-muted">
          +{countries.length - 5} more countries · Total: ${totalProceeds.toFixed(2)} · {totalDownloads} downloads
        </div>
      )}
    </div>
  );
}
