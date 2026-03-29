import Link from "next/link";
import { NavLinks } from "@/components/nav-links";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Top bar - minimal, warm */}
      <header className="sticky top-0 z-10 border-b border-border bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L12.5 4V10L7 13L1.5 10V4L7 1Z" fill="white" fillOpacity="0.9" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-text-primary">
              Orchard
            </span>
          </Link>

          <NavLinks />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {children}
      </main>
    </div>
  );
}
