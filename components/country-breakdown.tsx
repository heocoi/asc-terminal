"use client";

import type { DailySales } from "@/lib/types";

// Common country code -> flag + name
const COUNTRIES: Record<string, { flag: string; name: string }> = {
  US: { flag: "🇺🇸", name: "United States" },
  GB: { flag: "🇬🇧", name: "United Kingdom" },
  CA: { flag: "🇨🇦", name: "Canada" },
  AU: { flag: "🇦🇺", name: "Australia" },
  JP: { flag: "🇯🇵", name: "Japan" },
  DE: { flag: "🇩🇪", name: "Germany" },
  FR: { flag: "🇫🇷", name: "France" },
  KR: { flag: "🇰🇷", name: "South Korea" },
  CN: { flag: "🇨🇳", name: "China" },
  TW: { flag: "🇹🇼", name: "Taiwan" },
  VN: { flag: "🇻🇳", name: "Vietnam" },
  IN: { flag: "🇮🇳", name: "India" },
  BR: { flag: "🇧🇷", name: "Brazil" },
  MX: { flag: "🇲🇽", name: "Mexico" },
  IT: { flag: "🇮🇹", name: "Italy" },
  ES: { flag: "🇪🇸", name: "Spain" },
  NL: { flag: "🇳🇱", name: "Netherlands" },
  SE: { flag: "🇸🇪", name: "Sweden" },
  NO: { flag: "🇳🇴", name: "Norway" },
  DK: { flag: "🇩🇰", name: "Denmark" },
  CH: { flag: "🇨🇭", name: "Switzerland" },
  RU: { flag: "🇷🇺", name: "Russia" },
  TH: { flag: "🇹🇭", name: "Thailand" },
  SG: { flag: "🇸🇬", name: "Singapore" },
  MY: { flag: "🇲🇾", name: "Malaysia" },
  ID: { flag: "🇮🇩", name: "Indonesia" },
  PH: { flag: "🇵🇭", name: "Philippines" },
  SA: { flag: "🇸🇦", name: "Saudi Arabia" },
  AE: { flag: "🇦🇪", name: "UAE" },
  TR: { flag: "🇹🇷", name: "Turkey" },
  PL: { flag: "🇵🇱", name: "Poland" },
  NZ: { flag: "🇳🇿", name: "New Zealand" },
  ZA: { flag: "🇿🇦", name: "South Africa" },
  IE: { flag: "🇮🇪", name: "Ireland" },
  AT: { flag: "🇦🇹", name: "Austria" },
  BE: { flag: "🇧🇪", name: "Belgium" },
  PT: { flag: "🇵🇹", name: "Portugal" },
  HK: { flag: "🇭🇰", name: "Hong Kong" },
  FI: { flag: "🇫🇮", name: "Finland" },
  CZ: { flag: "🇨🇿", name: "Czechia" },
  IL: { flag: "🇮🇱", name: "Israel" },
  AR: { flag: "🇦🇷", name: "Argentina" },
  CO: { flag: "🇨🇴", name: "Colombia" },
  CL: { flag: "🇨🇱", name: "Chile" },
};

function getCountry(code: string) {
  return COUNTRIES[code] ?? { flag: "🏳️", name: code };
}

interface CountryData {
  code: string;
  proceeds: number;
  downloads: number;
}

export function CountryBreakdown({ sales, appId }: { sales: DailySales[]; appId: string }) {
  // Aggregate country data across all days
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
    .map(([code, data]) => ({ code, ...data }))
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
          const country = getCountry(c.code);
          const pct = totalProceeds > 0 ? (c.proceeds / totalProceeds) * 100 : 0;
          const barWidth = (c.proceeds / maxProceeds) * 100;

          return (
            <div key={c.code} className="group relative">
              {/* Background bar */}
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-accent-subtle transition-all group-hover:bg-accent/8"
                style={{ width: `${barWidth}%` }}
              />
              <div className="relative flex items-center gap-3 rounded-md px-3 py-2">
                <span className="text-sm">{country.flag}</span>
                <span className="flex-1 text-xs font-medium text-text-primary">{country.name}</span>
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
