# ASC Dashboard

Lightweight, self-hosted App Store Connect analytics dashboard. Deploy your own instance on Vercel with one click.

## Features

- Revenue & downloads charts (30 days, stacked by app)
- Summary cards (today / 7d / 30d)
- App status grid (live, in review, rejected...)
- Per-app detail with reviews & ratings
- Simple password auth
- No database needed (caches ASC API responses)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/phatle/asc-dashboard&env=ASC_KEY_ID,ASC_ISSUER_ID,ASC_PRIVATE_KEY,ASC_VENDOR_NUMBER,DASHBOARD_PASSWORD&envDescription=App%20Store%20Connect%20API%20credentials&project-name=asc-dashboard)

## Setup

### 1. Get your ASC API Key

1. Go to [App Store Connect > Users and Access > Integrations > Team Keys](https://appstoreconnect.apple.com/access/integrations/api)
2. Generate a new key with **Admin** or **Sales** access
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

## Tech Stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- Recharts
- jose (JWT)

## Privacy

Your API keys never leave your Vercel instance. All ASC API calls happen server-side. No data is sent to any third party.

## License

MIT
