# Chokepoint

A thesis-testing dashboard for two "bottleneck" stock baskets that came out of an AI-infrastructure research thread:

- **Optical Bottleneck** (AI data centres run out of copper): LITE, COHR, MRVL, ALAB, FN, GLW, AVGO
- **Humanoid Bottleneck** (what every humanoid maker has to buy): MP, NOVT, Keyence (6861 JP), Harmonic Drive (6324 JP), APH, Nidec (6594 JP), TDY

The research had already answered *who benefits if the thesis is right*. It stopped at the harder question: *which of these is not already priced for it?* This app is that screen.

## What it does

- **Live market data** for all 14 names plus the KOID humanoid ETF and USD/JPY, from Yahoo Finance (price, market cap, forward P/E, EV/Sales, revenue growth, margins, analyst target, 52-week range, one-year weekly sparkline). Cached for 10 minutes; falls back to a bundled snapshot (`data/snapshot.json`) if the feed is unavailable.
- **Thesis factors** carried over from the discussion for each stock: bottleneck exposure, revenue sensitivity, moat, and 2027–29 evidence (0–5 each), along with the thesis, cited evidence and key risk.
- **Priced-in score**: a crowding gauge built from five percentile ranks across the universe — forward P/E, EV/Sales, forward P/E ÷ revenue growth, distance from the 52-week high, and upside to the analyst target.
- **Composite ranking** with adjustable factor weights, so you can see the ranking on thesis merit alone or lean into valuation.
- **Quadrant chart** of thesis fit vs. priced in. Top-left ("Underappreciated bottleneck") is where we want to find names.
- **Test sleeve builder**: size a paper sleeve, use the thread's provisional weights or score-weighted / equal / carry-forward presets, and get share counts (Tokyo names converted at the live USD/JPY rate).

## Run it

```bash
npm install
npm run dev -- --port 4317
```

Then open <http://127.0.0.1:4317>.

`npm run build && npm start` for a production build. No environment variables or API keys are needed.

## Deploy to Netlify

The repo ships a `netlify.toml` that uses Netlify's Next.js runtime, so no extra setup is needed.

**From the Netlify UI:** push this folder to a Git repository (GitHub, GitLab or Bitbucket), then in Netlify choose *Add new site → Import an existing project*, pick the repo and accept the detected settings (build command `npm run build`, publish directory `.next`, Node 22).

**From the command line:**

```bash
npm install -g netlify-cli
netlify login
netlify init      # create or link a site
netlify deploy --build --prod
```

The `/api/quotes` route runs as a Netlify Function and fetches Yahoo Finance on demand (cached ~10 minutes per warm instance). The bundled snapshot is imported into the function so the fallback works on serverless hosts.

## Structure

| Path | Purpose |
| --- | --- |
| `lib/universe.ts` | The 14 stocks: roles, tiers, qualitative scores, thesis, evidence, risks, provisional weights |
| `lib/scoring.ts` | Thesis fit, priced-in percentiles, composite score, quadrant assignment |
| `lib/yahoo.ts` | Yahoo Finance client (anonymous crumb session, retry, bounded concurrency) |
| `app/api/quotes/route.ts` | `/api/quotes` — fetches all symbols, caches, falls back to snapshot |
| `components/dashboard.tsx` | Page shell, theme tabs, KPIs, layout |
| `components/ranking-table.tsx` | Ranked table with market data and score bars |
| `components/quadrant-chart.tsx` | Recharts scatter of thesis fit vs. priced in |
| `components/stock-sheet.tsx` | Per-stock detail drawer |
| `components/sleeve-builder.tsx` | Paper-sleeve allocation table |
| `data/snapshot.json` | Offline fallback quotes |

## Editing the universe

Add or change a stock in `lib/universe.ts`. Use the Yahoo symbol (`6324.T` for Tokyo). The scoring, chart, sleeve and API pick it up automatically.

## Caveats

This is a research tool, not investment advice. The qualitative scores are editorial judgements transcribed from the discussion, the priced-in score is a relative crowding gauge rather than a fair-value estimate, and Yahoo Finance data may be delayed. Yahoo's endpoints are unofficial and can throttle; the app retries and falls back to the snapshot.
