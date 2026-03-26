import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASC Dashboard",
  description: "Lightweight App Store Connect Analytics Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
