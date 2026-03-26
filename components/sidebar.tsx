"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", soon: false },
  { href: "#", label: "Reviews", soon: true },
  { href: "#", label: "Submit", soon: true },
  { href: "#", label: "Ads", soon: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-52 shrink-0 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="px-5 py-4">
        <span className="text-base font-semibold">ASC Terminal</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            !item.soon &&
            (item.href === "/"
              ? pathname === "/" || pathname.startsWith("/app/")
              : pathname.startsWith(item.href));

          if (item.soon) {
            return (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-md px-3 py-2"
              >
                <span className="text-sm text-text-muted">{item.label}</span>
                <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-text-muted">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-accent-subtle font-medium text-accent"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-5 py-3 text-xs text-text-muted">
        v0.2.0
      </div>
    </aside>
  );
}
