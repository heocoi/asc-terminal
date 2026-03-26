import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASC Terminal",
  description: "App Store Connect Analytics Terminal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="mx-auto max-w-[1400px] px-3 py-4">
          {children}
        </div>
      </body>
    </html>
  );
}
