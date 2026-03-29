# ASC Terminal

Self-hosted App Store Connect dashboard for indie developers with app portfolios. Built as a replacement for ASC's analytics UI, which recently deprecated its portfolio-level Trends view.

No database. No third-party analytics. Your API keys stay on your Vercel instance.

<!-- TODO: Add screenshots before public launch -->
<!-- ![Dashboard](docs/screenshot-dashboard.png) -->
<!-- ![App Detail](docs/screenshot-app-detail.png) -->

## Features

**Portfolio Overview**
- Revenue ticker with daily, 7-day, and month-to-date totals (subscription breakdown inline)
- Attention panel for rejected builds, review queue, download anomalies, and bad reviews
- Revenue trend chart (stacked by app) with Revenue / Downloads / Subscriptions toggle
- Compact app list sorted by revenue, with sparklines and pricing model badges

**Per-App Detail**
- Revenue, subscription revenue, and download cards with period comparison (7D/14D/30D)
- Country breakdown (top 5 markets by proceeds)
- Customer reviews with rating histogram and negative review filter
- Pricing model breakdown (subscriptions, IAPs with actual prices from ASC API)

**Analytics Reports API** (optional, requires one-time setup)
- App Store engagement metrics (impressions, page views, conversion rate)
- Subscription analytics (active paid, free trials, billing issues, trial-to-paid, churns)
- Subscription trend chart (Active Subs / Events dual view)
- Usage metrics (sessions, crashes, active devices, net installs)
- Conversion rate (CVR%) in portfolio list

**Settings**
- One-click "Enable All" to create ONGOING analytics report requests for all apps
- Per-app setup status (Not Setup / Active / Inactive)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/phatle/asc-terminal&env=ASC_KEY_ID,ASC_ISSUER_ID,ASC_PRIVATE_KEY,ASC_VENDOR_NUMBER,DASHBOARD_PASSWORD&envDescription=App%20Store%20Connect%20API%20credentials&project-name=asc-terminal)

## Setup

### 1. Get your ASC API Key

1. Go to [App Store Connect > Users and Access > Integrations > Team Keys](https://appstoreconnect.apple.com/access/integrations/api)
2. Generate a new key with **Admin** access (required for first-time Analytics Reports setup; **Sales** role works after)
3. Note the **Key ID** and **Issuer ID**
4. Download the `.p8` private key file

### 2. Get your Vendor Number

Go to App Store Connect > Sales and Trends. Your vendor number is in the top right dropdown.

### 3. Set environment variables

| Variable | Description |
|----------|-------------|
| `ASC_KEY_ID` | API Key ID from step 1 |
| `ASC_ISSUER_ID` | Issuer ID from step 1 |
| `ASC_PRIVATE_KEY` | Base64-encoded content of your .p8 file: `cat AuthKey_XXX.p8 \| base64` |
| `ASC_VENDOR_NUMBER` | Your vendor number from step 2 |
| `DASHBOARD_PASSWORD` | Optional. Set to enable password protection |

### 4. Run locally

```bash
cp .env.example .env.local
# Fill in your values
npm install
npm run dev
```

### 5. Enable Analytics Reports (optional)

After deploying, go to **Settings** and click **Enable All**. Apple's Analytics Reports API requires creating ONGOING report requests per app. First data appears ~24-48 hours after setup.

This enables engagement metrics (impressions, conversion rate), subscription lifecycle events, and usage data. The dashboard works without this - sales data (revenue, downloads) is always available.

## Architecture

- **Next.js 16** (App Router, Server Components for data fetching, Client Components for interactivity)
- **Tailwind CSS v4** (Warm Paper theme)
- **Recharts** (charts and sparklines)
- **jose** (JWT signing for ASC API auth)
- **No database** - ASC API data cached via Next.js `unstable_cache` (1h for sales, 6h for analytics, 24h for pricing/metadata)

### Data Sources

| Source | Data | Latency | Setup |
|--------|------|---------|-------|
| Sales Reports API (`/v1/salesReports`) | Revenue, downloads, proceeds, refunds, subscription/IAP breakdown | T+1 | Automatic |
| Analytics Reports API (`/v1/analyticsReportRequests`) | Impressions, page views, conversion rate, subscription events/state, usage | T+2 | One-click in Settings |
| iTunes Lookup API | App icons, ratings, store metadata | Real-time | Automatic |
| App Store Connect API | App versions, status, pricing, reviews | Real-time | Automatic |

## Privacy

Your API keys never leave your Vercel instance. All ASC API calls happen server-side. No data is sent to any third party. No tracking, no analytics collection.

## License

MIT
