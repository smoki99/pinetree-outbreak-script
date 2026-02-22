# Pinetree Strategy – Angular Chart UI

Angular app that runs the **Palantir Strategy** logic in-app: symbol selector, **Lightweight Charts** (candles, volume, SMA 50/200, forecast lines, stop), and a **dashboard** (warnings, fund grade, profit, trends, 1Y forecast, RSI, ADX, sector fit, etc.). **All data comes from Yahoo Finance** via a small Node server — no API keys needed.

## What this does

- **Symbol selector** with autocomplete (e.g. AAPL, PLTR, NASDAQ:MSFT).
- **In-app strategy**: Your script.pine logic is reimplemented in TypeScript (valuation model, warnings, grade, forecast, entry/warning signals).
- **Chart**: Candlesticks, volume, SMA 50/200, bear/fair/bull forecast lines, suggested stop.
- **Dashboard**: Warnings, fund grade, profit, revenue/FCF trend, 1Y bear/fair/bull, trend, ADX, RSI, volume status, sector fit, stop/R:R.

## Run the app (Yahoo — no API keys)

**Terminal 1 – Yahoo API server**

```bash
cd angular-app/server
npm install
npm start
```

Server runs at http://localhost:3000.

**Terminal 2 – Angular app**

```bash
cd angular-app
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). Select a symbol; the app gets candles and fundamentals from the Yahoo server and shows the chart + dashboard.

**One command (both together)**

From `angular-app`:

```bash
npm run start:all
```

(Runs the server and `ng serve`; requires `concurrently`.)

## Build

```bash
npm run build
```

Output is in `dist/pinetree-chart/`. For production you’ll need the Yahoo server (or another API) to serve `/api/candles` and `/api/fundamentals`.

## Tech

- Angular 18 (standalone, signals)
- **Lightweight Charts** (TradingView) for the chart
- **Node server** (`server/`): Express + [yahoo-finance2](https://www.npmjs.com/package/yahoo-finance2) for candles and fundamentals from Yahoo (no keys)
- Strategy logic reimplemented from script.pine in TypeScript
