export function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const isUp = pct >= 0;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
      isUp ? "text-positive-text" : "text-negative-text"
    }`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
        className={isUp ? "" : "rotate-180"}>
        <path d="M5 2L8.5 6.5H1.5L5 2Z" />
      </svg>
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}
