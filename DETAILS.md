# Palantir Strategy: Ultimate Master Guard V10

## Complete Documentation, Theory & Specification

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Theoretical Foundations](#theoretical-foundations)
3. [Architecture Overview](#architecture-overview)
4. [Module Specifications](#module-specifications)
   - [Input Parameters](#1-input-parameters)
   - [Data Acquisition Layer](#2-data-acquisition-layer)
   - [Fundamental Analysis Engine](#3-fundamental-analysis-engine)
   - [Restructuring Detection](#4-restructuring-detection)
   - [Profitability Classification](#5-profitability-classification)
   - [9-Point Warning System](#6-9-point-warning-system)
   - [Smart FCF Growth Rate & Decay Model](#7-smart-fcf-growth-rate--decay-model)
   - [P/FCF Price Forecast Model](#8-pfcf-price-forecast-model)
   - [Fundamental Grade](#9-fundamental-grade)
   - [Sector Rotation Module](#10-sector-rotation-module)
   - [Technical Analysis Engine](#11-technical-analysis-engine)
   - [Signal Generation System](#12-signal-generation-system)
   - [Probability Engine](#13-probability-engine)
   - [Visualization & Dashboard](#14-visualization--dashboard)
5. [Signal Logic Flowchart](#signal-logic-flowchart)
6. [Limitations & Disclaimers](#limitations--disclaimers)
7. [References & Further Reading](#references--further-reading)

---

## Executive Summary

The **Ultimate Master Guard V10** is a multi-factor overlay indicator for TradingView (Pine Script v6) that combines **fundamental analysis**, **technical analysis**, **sector rotation modeling**, and **probabilistic forecasting** into a single unified dashboard. It was designed primarily for growth/tech stock analysis (originally Palantir Technologies) but is applicable to any equity with financial data available on TradingView.

The indicator does **not** generate automated trades. Instead, it provides a comprehensive **decision-support dashboard** with:

- **9 fundamental warning signs** monitored in real-time
- **P/FCF-based 1-year price forecasts** (bear / fair / bull)
- **Sector rotation phase detection** with dual-timeframe confirmation
- **Entry and warning signals** filtered through both fundamental and technical criteria
- **Probabilistic estimates** for breakout and breakdown events

---

## Theoretical Foundations

### 1. CAN SLIM Methodology (William O'Neil)

> **Source:** William J. O'Neil, *How to Make Money in Stocks* (McGraw-Hill, 1988, 4th ed. 2009)
> **Link:** [Investor's Business Daily — CAN SLIM](https://www.investors.com/ibd-university/can-slim/)

The CAN SLIM framework is a growth-stock selection system developed by William O'Neil, founder of Investor's Business Daily. The acronym stands for:

| Letter | Meaning | How V10 Implements It |
|--------|---------|----------------------|
| **C** | Current quarterly earnings per share | EPS (FY) tracking, `warnEPSLoss` flag |
| **A** | Annual earnings growth | Revenue CAGR, FCF CAGR multi-year tracking |
| **N** | New products, management, price highs | Breakout detection via `highestHigh` crossover |
| **S** | Supply and demand (volume) | Volume surge detection (`volThreshold`), accumulation/distribution |
| **L** | Leader or laggard (relative strength) | RS comparison vs. benchmark (`compSymbol`) |
| **I** | Institutional sponsorship | Volume analysis as proxy for institutional activity |
| **M** | Market direction | Weekly trend (MA50 vs MA200), sector rotation phase |

Key CAN SLIM concepts used in this script:

- **Breakout from a base pattern**: The `baseLookback` parameter identifies consolidation ranges. Entry signals trigger when price crosses above the highest high of that base on above-average volume — this is the classic CAN SLIM "pivot point" buy.
- **Relative Strength**: O'Neil emphasized buying stocks that outperform the market. The RS module compares the stock's 20-day performance against a global benchmark (default: URTH / MSCI World ETF).
- **Volume confirmation**: O'Neil required breakouts to occur on volume at least 50% above average. The script uses a configurable multiplier (default 1.5x for general signals, 1.2x for entry).

### 2. Discounted Cash Flow / FCF-Based Valuation (Aswath Damodaran)

> **Source:** Aswath Damodaran, *Investment Valuation* (Wiley, 3rd ed. 2012)
> **Link:** [Damodaran Online — NYU Stern](https://pages.stern.nyu.edu/~adamodar/)
> **Link:** [Damodaran's Valuation Spreadsheets](http://pages.stern.nyu.edu/~adamodar/New_Home_Page/spreadsh.htm)

The P/FCF forecast model is a simplified application of Damodaran's intrinsic valuation framework:

- **Free Cash Flow per Share** is the foundation metric (FCF / shares outstanding)
- **Growth rate** is projected forward using historical CAGR with a **decay function** that reflects Damodaran's principle that high growth rates are unsustainable and must converge toward the economy's growth rate
- **Multiple expansion/contraction** is modeled via ±30% bands on the current P/FCF ratio, representing bull/bear sentiment shifts

This is intentionally simpler than a full DCF model because:
1. TradingView's `request.financial()` provides limited granularity
2. A full DCF requires assumptions about WACC, terminal growth, and reinvestment rates that cannot be reliably automated
3. The ±30% band approach captures the range of plausible outcomes without false precision

### 3. Sector Rotation Theory (Sam Stovall / Martin Pring)

> **Source:** Sam Stovall, *Standard & Poor's Guide to Sector Investing* (McGraw-Hill, 1996)
> **Source:** Martin J. Pring, *The All-Season Investor* (Wiley, 1992)
> **Link:** [Fidelity — Sector Rotation](https://www.fidelity.com/learning-center/trading-investing/markets-sectors/business-cycle-702702)
> **Link:** [StockCharts — Sector Rotation Model](https://school.stockcharts.com/doku.php?id=market_analysis:sector_rotation_model)

The business cycle rotates through four phases, each favoring different sectors:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    BUSINESS CYCLE ROTATION                          │
│                                                                     │
│   EARLY RECOVERY ──► MID EXPANSION ──► LATE EXPANSION ──► DEFENSIVE│
│   (Financials,       (Technology,      (Energy,           (Healthcare│
│    Real Estate,       Industrials,      Materials,         Utilities,│
│    Consumer Cyclical) Communication)    Industrials)       Staples)  │
│         ▲                                                     │     │
│         └─────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────┘
```

The script detects the current phase by comparing relative performance of sector ETFs:
- **XLK** (Technology), **XLF** (Financials), **XLV** (Healthcare)
- **XLE** (Energy), **XLP** (Consumer Staples), **XLU** (Utilities)

It uses a **dual-timeframe approach**:
- **Long lookback** (default 60 days): Established phase
- **Short lookback** (fixed 20 days): Emerging/transitioning phase
- When they disagree → **transition detected** → shown as `» PHASE (was PREVIOUS)`

### 4. ADX / Directional Movement System (J. Welles Wilder)

> **Source:** J. Welles Wilder Jr., *New Concepts in Technical Trading Systems* (Trend Research, 1978)
> **Link:** [Investopedia — ADX](https://www.investopedia.com/terms/a/adx.asp)

Wilder's Average Directional Index measures trend strength regardless of direction:
- **ADX > 20** (configurable): Market is trending → signals are more reliable
- **ADX < 20**: Market is choppy/range-bound → signals are filtered out
- The script implements Wilder's original calculation: DM+, DM-, smoothed with RMA, then DX → ADX

### 5. RSI — Relative Strength Index (J. Welles Wilder)

> **Source:** J. Welles Wilder Jr., *New Concepts in Technical Trading Systems* (Trend Research, 1978)
> **Link:** [Investopedia — RSI](https://www.investopedia.com/terms/r/rsi.asp)

Used as an **overbought filter** on entry signals:
- RSI above 75 (configurable) blocks new entry signals to avoid buying into exhaustion
- RSI below 30 is flagged as "OVERSOLD" on the dashboard

### 6. ATR — Average True Range (J. Welles Wilder)

> **Source:** J. Welles Wilder Jr., *New Concepts in Technical Trading Systems* (Trend Research, 1978)
> **Link:** [Investopedia — ATR](https://www.investopedia.com/terms/a/atr.asp)

Used for **stop-loss calculation**:
- Stop = MAX(close − 2×ATR, lowest low of base period)
- The 2×ATR multiple is a widely used convention in trend-following systems (e.g., Keltner Channels use 2×ATR bands)

### 7. Log-Normal Return Distribution (Black-Scholes Framework)

> **Source:** Fischer Black & Myron Scholes, "The Pricing of Options and Corporate Liabilities" (1973)
> **Link:** [Investopedia — Log-Normal Distribution](https://www.investopedia.com/terms/l/log-normal-distribution.asp)

The probability engine assumes stock returns are approximately log-normally distributed:
- `logReturn = ln(close / close[1])` — continuously compounded daily return
- `σ = stdev(logReturn, lookback)` — historical volatility
- `expectedMove = close × σ × √5` — expected 5-day price movement (√T scaling from Brownian motion)

This is the same assumption underlying the **Black-Scholes option pricing model**. While real returns exhibit fat tails and skewness, log-normal is a reasonable first approximation for 5-day horizons.

### 8. Moving Average Crossover Systems (Richard Donchian / Edwin Coppock)

> **Source:** Richard Donchian, pioneer of trend-following (1930s–1960s)
> **Link:** [Investopedia — Moving Average](https://www.investopedia.com/terms/m/movingaverage.asp)

- **50-day SMA** ("Momentum Line"): Medium-term trend
- **200-day SMA** ("Trend Line"): Long-term trend / institutional reference
- **Golden Cross** (50 > 200): Bullish regime
- **Death Cross** (50 < 200): Bearish regime
- Weekly 10/40 SMA cross: Multi-timeframe trend confirmation

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT PARAMETERS (22)                        │
└────────────────────────┬────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATA ACQUISITION LAYER (~18 request.* calls)       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Financial     │  │ Price/Volume │  │ Sector ETFs        │    │
│  │ (FCF, Rev,   │  │ (Weekly,     │  │ (XLK,XLF,XLV,     │    │
│  │  EPS, NI,    │  │  Comparison) │  │  XLE,XLP,XLU)      │    │
│  │  Debt)       │  │              │  │                    │    │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘    │
└─────────┼─────────────────┼───────────────────┼────────────────┘
          ▼                 ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
│ FUNDAMENTAL      │ │ TECHNICAL        │ │ SECTOR ROTATION      │
│ ENGINE           │ │ ENGINE           │ │ MODULE               │
│                  │ │                  │ │                      │
│ • CAGR Calc      │ │ • SMA 50/200     │ │ • Phase Scoring      │
│ • Restructuring  │ │ • ADX/DI+/DI-    │ │ • Dual Timeframe     │
│ • Profitability  │ │ • RSI            │ │ • Transition Detect   │
│ • 9 Warnings     │ │ • ATR            │ │ • Sector Fit Match    │
│ • FCF Decay      │ │ • Volume Profile │ │                      │
│ • P/FCF Forecast │ │ • Relative Str.  │ │                      │
│ • Fund. Grade    │ │ • Probabilities  │ │                      │
└────────┬─────────┘ └────────┬─────────┘ └──────────┬───────────┘
         │                    │                       │
         ▼                    ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SIGNAL GENERATION SYSTEM                        │
│                                                                 │
│  Entry = Breakout + Volume + Above MAs + Profitable + Trending  │
│          + RSI < OB + Weekly Bullish + Cooldown OK              │
│                                                                 │
│  Warning = MA50 Crossunder + Volume Surge + Cooldown OK         │
└────────────────────────┬────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VISUALIZATION LAYER                          │
│  ┌────────────────┐  ┌─────────────────┐  ┌────────────────┐   │
│  │ Chart Overlays │  │ Signal Labels   │  │ Dashboard      │   │
│  │ (MAs, Stop,    │  │ (ENTRY/WARNING) │  │ (27-row table) │   │
│  │  Forecast)     │  │                 │  │                │   │
│  └───────────────��┘  └─────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Specifications

### 1. Input Parameters

| Parameter | Type | Default | Range | Purpose | Justification |
|-----------|------|---------|-------|---------|---------------|
| `smaFast` | int | 50 | ≥1 | Short-term moving average period | 50-day SMA is the standard institutional momentum line; widely tracked by fund managers |
| `smaSlow` | int | 200 | ≥1 | Long-term moving average period | 200-day SMA is the most widely followed long-term trend indicator on Wall Street |
| `volThreshold` | float | 1.5 | ≥1.1 | Volume surge multiplier | O'Neil's CAN SLIM requires 50%+ above average volume on breakouts; 1.5x is the standard |
| `baseLookback` | int | 50 | ≥20 | Period for highest high / lowest low | ~2.5 months of trading; captures most base patterns (cup-with-handle, flat base, etc.) |
| `probLookback` | int | 20 | ≥5 | Volatility estimation window | ~1 month; balances responsiveness vs. stability for σ estimation |
| `compSymbol` | symbol | URTH | — | Relative strength benchmark | MSCI World ETF; represents global equities for RS comparison |
| `cooldownBars` | int | 10 | ≥1 | Minimum bars between signals | Prevents signal spam during volatile periods; ~2 trading weeks |
| `adxLen` | int | 14 | ≥5 | ADX calculation period | Wilder's original recommendation; industry standard |
| `adxThreshold` | float | 20 | ≥10 | Trend/chop boundary | Wilder's convention: ADX > 20–25 = trending; <20 = ranging |
| `rsiLen` | int | 14 | ≥5 | RSI calculation period | Wilder's original recommendation |
| `rsiOB` | float | 75 | 60–95 | RSI overbought threshold | Set at 75 (not classic 70) to allow momentum stocks room to run |
| `atrLen` | int | 14 | ≥5 | ATR calculation period | Wilder's original recommendation |
| `showForecast` | bool | true | — | Toggle forecast lines | Allows clean chart when forecast not needed |
| `sharesInput` | float | 0 | ≥0 | Manual shares outstanding (billions) | Override for when auto-detection fails (EPS=0, data gaps) |
| `rotationLookback` | int | 60 | 20–120 | Sector rotation long lookback | ~3 months; captures established rotation trends |

### 2. Data Acquisition Layer

The script makes approximately **18 `request.*()` calls** (Pine Script v6 limit: 40):

#### Financial Data Requests

| Call | Data | Period | Purpose |
|------|------|--------|---------|
| `request.financial("NET_INCOME", "FQ")` | Net Income | Quarterly | Most recent profitability check |
| `request.financial("NET_INCOME", "FY")` | Net Income | Annual | Profitability + shares calculation |
| `request.financial("FREE_CASH_FLOW", "FY")` | FCF | Annual | Core valuation metric |
| `request.financial("EARNINGS_PER_SHARE", "FY")` | EPS | Annual | Profitability + shares calculation |
| `request.financial("TOTAL_REVENUE", "FY")` | Revenue | Annual | Growth tracking |
| `request.financial("TOTAL_DEBT", "FQ")` | Total Debt | Quarterly | Leverage warning |

#### Security Data Requests

| Call | Symbol | Timeframe | Purpose |
|------|--------|-----------|---------|
| `request.security(tickerid, "12M", [fcf...])` | Self | Annual | 5-year FCF history |
| `request.security(tickerid, "12M", [rev...])` | Self | Annual | 5-year revenue history |
| `request.security(tickerid, "12M", [ni...])` | Self | Annual | 2-year net income history |
| `request.security(compSymbol, ...)` | Benchmark | Current TF | Relative strength |
| `request.security(tickerid, "W", ...)` | Self | Weekly | Weekly trend (2 calls) |
| `request.security("AMEX:XLK", ...)` | Tech ETF | Current TF | Sector rotation |
| `request.security("AMEX:XLF", ...)` | Financial ETF | Current TF | Sector rotation |
| `request.security("AMEX:XLV", ...)` | Health ETF | Current TF | Sector rotation |
| `request.security("AMEX:XLE", ...)` | Energy ETF | Current TF | Sector rotation |
| `request.security("AMEX:XLP", ...)` | Staples ETF | Current TF | Sector rotation |
| `request.security("AMEX:XLU", ...)` | Utilities ETF | Current TF | Sector rotation |

#### Shares Outstanding Auto-Detection

```
sharesOut = |Net Income (FY) / EPS (FY)|
```

**Justification:** TradingView does not provide a direct `SHARES_OUTSTANDING` financial field. Since `EPS = Net Income / Shares`, we can reverse-engineer shares outstanding. The `math.abs()` handles cases where both NI and EPS are negative (loss-making companies). A fallback to the previous year's calculation ensures continuity when current-year data is unavailable.

### 3. Fundamental Analysis Engine

#### CAGR Calculation (`growthCAGR` function)

The function calculates Compound Annual Growth Rate with intelligent fallbacks:

```
CAGR = (Current / Base)^(1/Years) − 1
```

**Cascading logic:**

| Priority | Condition | Result |
|----------|-----------|--------|
| 1st | 4 years of positive data available | 4-year CAGR |
| 2nd | 3 years of positive data | 3-year CAGR |
| 3rd | 2 years of positive data | 2-year CAGR |
| 4th | 1 year of positive data | 1-year growth rate |
| 5th | Base ≤ 0, current > 0 | +100% "TURNAROUND" |
| 6th | Base > 0, current ≤ 0 | −100% "DETERIORATING" |
| 7th | Both negative, improving | +50% "IMPROVING" |
| 8th | Both negative, worsening | −50% "WORSENING" |
| 9th | Both zero | 0% "FLAT" |

**Justification:** Standard CAGR requires positive values for the `math.pow()` root. Real companies transition through unprofitable periods, so the fallback system handles every combination of positive/negative/zero values with meaningful labels.

**Thresholds:**

| CAGR Range | Classification | Color |
|------------|----------------|-------|
| > +10% | GROWING | 🟢 Green |
| −10% to +10% | STABLE | 🔵 Blue |
| < −10% | DECLINING | 🔴 Red |

**Justification:** The ±10% threshold is aligned with typical growth stock expectations. S&P 500 average revenue growth is ~5-7% annually, so 10%+ represents above-market growth.

### 4. Restructuring Detection

```
isRestructured = (Y0/Y1 revenue drop > 15%) AND (Y1/Y2 revenue drop < 10%)
```

**What it detects:** A company that experienced a sharp revenue decline in the most recent year (>15% drop) but was relatively stable before (<10% drop in the prior year). This pattern indicates:
- Corporate spinoffs (e.g., GE → GE Vernova + GE Aerospace)
- Divestitures of business units
- Accounting restatements
- Major segment discontinuations

**Why it matters:** Multi-year CAGR calculations become meaningless after a restructuring because the "company" being measured has fundamentally changed. When detected:
- Revenue trend displays "RESTRUCTURED (use 1Y)"
- FCF growth rate is set to 0% for forecasting
- Warning flags respect the restructuring flag to avoid false positives

### 5. Profitability Classification

The script uses a **three-tier profitability system**:

| Tier | Condition | Label | Color | Rationale |
|------|-----------|-------|-------|-----------|
| **GAAP Profitable** | Net Income > 0 | "YES (xxxM)" | 🟢 Green | Standard accounting profitability |
| **Cash Profitable** | NI ≤ 0 BUT FCF > 0 AND EPS > 0 | "CASH PROF." | 🔵 Blue | Asset-heavy companies (Amazon early years, Tesla pre-2020) may show GAAP losses due to depreciation while generating positive cash flow |
| **Not Profitable** | Neither condition met | "NO" | 🔴 Red | Company is burning cash |

**Justification:** GAAP profitability alone penalizes companies making large capital investments. Amazon was "unprofitable" by GAAP for years while generating massive FCF. The cash-profitable tier captures this important nuance. The additional EPS > 0 check ensures the company isn't just manipulating working capital.

### 6. 9-Point Warning System

Each warning represents a specific fundamental risk factor:

#### Warning 1: Share Dilution (`warnDilution`)

```
Trigger: (sharesOut / sharesOutPrev − 1) > 5%
```

| Aspect | Detail |
|--------|--------|
| **What** | Year-over-year increase in shares outstanding exceeding 5% |
| **Why** | Dilution destroys per-share value. If shares grow faster than earnings, EPS declines even as total earnings rise |
| **Threshold** | 5% is considered aggressive dilution; most mature companies are <2% |
| **Source** | Buffett's emphasis on per-share value growth; Damodaran's equity dilution analysis |

#### Warning 2: Negative FCF (`warnFCFNeg`)

```
Trigger: FCF (FY) ≤ 0
```

| Aspect | Detail |
|--------|--------|
| **What** | Company consumed more cash than it generated in the most recent fiscal year |
| **Why** | Negative FCF means the company must raise capital (debt or equity) to fund operations |
| **Threshold** | Binary — any negative FCF triggers the warning |

#### Warning 3: Margin Squeeze (`warnMarginSqueeze`)

```
Trigger: Revenue growing > 0% AND Net Income growth < Revenue growth AND gap > 5%
```

| Aspect | Detail |
|--------|--------|
| **What** | Revenue is growing but profits aren't keeping pace — margins are compressing |
| **Why** | Indicates rising costs, competitive pressure, or pricing power erosion |
| **Threshold** | 5% gap between revenue growth and NI growth |
| **Exclusion** | Disabled during restructuring (revenue base changed) |

#### Warning 4: Revenue Decline (`warnRevDecline`)

```
Trigger: Multi-year revenue CAGR < −5%
```

| Aspect | Detail |
|--------|--------|
| **What** | Sustained top-line shrinkage over multiple years |
| **Why** | Revenue decline is the most fundamental business deterioration signal |
| **Threshold** | −5% allows for minor cyclical dips without triggering |

#### Warning 5: EPS Loss (`warnEPSLoss`)

```
Trigger: EPS (FY) < 0
```

| Aspect | Detail |
|--------|--------|
| **What** | Company reported a per-share loss for the fiscal year |
| **Why** | Directly impacts valuation models; PE ratio becomes meaningless with negative EPS |
| **CAN SLIM** | O'Neil's "C" and "A" criteria require positive and accelerating earnings |

#### Warning 6: FCF Deterioration (`warnFCFDeteriorate`)

```
Trigger: 1-year FCF change < −20% AND not in investment phase
```

| Aspect | Detail |
|--------|--------|
| **What** | Sharp year-over-year decline in free cash flow |
| **Why** | Even profitable companies can be in trouble if cash generation is rapidly declining |
| **Exclusion** | Disabled during "investment phase" (revenue growing >5% while FCF declining) — companies like Amazon intentionally sacrifice FCF for growth |

#### Warning 7: Overvaluation (`warnOvervalued`)

```
Trigger: P/FCF > 80
```

| Aspect | Detail |
|--------|--------|
| **What** | Price-to-Free-Cash-Flow ratio exceeds 80x |
| **Why** | At 80x P/FCF, the market is pricing in decades of high growth; any disappointment causes severe drawdowns |
| **Context** | S&P 500 median P/FCF is ~20-25x; growth stocks typically trade 30-60x; >80x is extreme |

#### Warning 8: Growth Stall (`warnGrowthStall`)

```
Trigger: Multi-year CAGR > 10% AND 1-year growth < 5% AND gap > 10%
```

| Aspect | Detail |
|--------|--------|
| **What** | Company had strong historical growth but the most recent year shows sharp deceleration |
| **Why** | Growth deceleration often precedes multiple compression — the stock may be priced for growth it's no longer delivering |
| **Source** | O'Neil's emphasis on accelerating earnings; Peter Lynch's "growth at a reasonable pace" |

#### Warning 9: Debt Heavy (`warnDebtHeavy`)

```
Trigger: Total Debt / FCF > 10 years
```

| Aspect | Detail |
|--------|--------|
| **What** | It would take more than 10 years of current FCF to repay all debt |
| **Why** | High leverage amplifies downside risk and limits financial flexibility |
| **Threshold** | 10 years is extremely high; investment-grade companies typically are 2-5x |

#### Warning Count Coloring

| Count | Color | Interpretation |
|-------|-------|----------------|
| 0 | 🟢 Green | "ALL CLEAR ✓" — no fundamental concerns detected |
| 1–2 | 🟠 Orange | Caution — monitor these factors |
| 3+ | 🔴 Red | Significant fundamental risk |

### 7. Smart FCF Growth Rate & Decay Model

#### Growth Rate Decay Function

```
decayGrowth(rawCAGR):
    if rawCAGR > 50%:  adj = 35% + (rawCAGR − 50%) × 0.25
    if rawCAGR > 20%:  adj = 20% + (rawCAGR − 20%) × 0.50
    else:              adj = rawCAGR
```

**Visualization:**

```
Raw CAGR →  Adjusted Growth
   10%   →   10.0%    (no adjustment)
   20%   →   20.0%    (no adjustment)
   30%   →   25.0%    (50% haircut on excess above 20%)
   40%   →   30.0%
   50%   →   35.0%
   70%   →   40.0%    (75% haircut on excess above 50%)
  100%   →   47.5%
```

**Justification (Damodaran's Growth Convergence):**

> "No company can grow at a rate significantly higher than the economy's growth rate forever."
> — Aswath Damodaran, *Investment Valuation*

Empirical research shows:
- Companies growing >30% rarely sustain it for >3 years
- Companies growing >50% almost never sustain it for >2 years
- The decay function mathematically enforces this mean-reversion

#### Smart Growth Rate Selection

| Condition | Growth Rate Used | Label |
|-----------|------------------|-------|
| Restructured company | 0% | "RESTRUCTURED" |
| Investment phase (Rev↑, FCF↓) | Average of FCF CAGR and Rev CAGR, floored at 0 | "INVEST ADJ" |
| FCF CAGR > 20% | Decay-adjusted CAGR | "DECAY ADJ" |
| FCF CAGR ≤ 20% | Raw FCF CAGR | (none) |
| No FCF data | 0% | (none) |

**Final clamping:** Growth rate is clamped to [−40%, +40%] to prevent extreme forecasts.

### 8. P/FCF Price Forecast Model

#### Calculation

```
FCF/Share (Forward) = FCF/Share (Current) × (1 + growthRate)

Price(Bear) = FCF/Share(Fwd) × P/FCF(Current) × 0.70
Price(Fair) = FCF/Share(Fwd) × P/FCF(Current) × 1.00
Price(Bull) = FCF/Share(Fwd) × P/FCF(Current) × 1.30

Upside(%) = (Price(Target) / Price(Current) − 1) × 100
```

#### Interpretation

| Scenario | Multiple Adjustment | Meaning |
|----------|---------------------|---------|
| **Bear** | −30% multiple compression | Sentiment deteriorates; market applies lower valuation |
| **Fair** | No change | FCF grows as projected; market maintains current valuation |
| **Bull** | +30% multiple expansion | Sentiment improves; market re-rates higher |

**Why ±30%?** Historical analysis of P/FCF ratios for growth stocks shows typical annual variation of 25-40% in valuation multiples. The ±30% band captures the middle of this range.

#### Validity Conditions

The forecast is only displayed when ALL conditions are met:
- `currentPFCF` is calculable (not `na`)
- `fcfPS0 > 0` (positive FCF per share)
- FCF is not negative (`!isFCFNegative`)

**Why no forecast for negative FCF?** A P/FCF ratio is meaningless when FCF is negative. Attempting to project prices from a negative base produces nonsensical results.

### 9. Fundamental Grade

| Score | Criteria Met | Grade | Color |
|-------|-------------|-------|-------|
| 5/5 | All | A+ | 🟢 Green |
| 4/5 | | A | 🟢 Green |
| 3/5 | | B | 🔵 Blue |
| 2/5 | | C | 🟠 Orange |
| 1/5 | | D | 🔴 Red |
| 0/5 | None | F | 🔴 Red |

**Five criteria:**

1. **Is profitable** (GAAP or cash profitable)
2. **FCF > 0** (annual free cash flow positive)
3. **FCF CAGR > 5%** (growing cash generation)
4. **Revenue CAGR > 5%** (growing top line)
5. **EPS > 0** (positive earnings per share)

### 10. Sector Rotation Module

#### Phase Scoring Algorithm

The `scorePhases()` function compares relative performance of 6 sector ETFs to score each business cycle phase:

| Phase | Scores +1 When... | Rationale |
|-------|-------------------|-----------|
| **Early Recovery** | Financials > Tech, Financials > Energy, Financials > Staples | Financials lead out of recessions (rate-sensitive, credit expansion) |
| **Mid Expansion** | Tech > Financials, Tech > Energy, Tech > Staples, Tech > Utilities | Technology leads during economic expansion (capex spending, innovation) |
| **Late Expansion** | Energy > Tech, Energy > Financials, Energy > Staples | Energy/commodities lead late cycle (inflation, capacity constraints) |
| **Defensive** | Staples > Tech, Utilities > Tech, Healthcare > Tech, Staples > Energy | Defensive sectors outperform when growth slows (flight to safety) |

The phase with the highest score wins. Maximum possible score per phase: 3–4 points.

#### Dual Timeframe Confirmation

| Timeframe | Lookback | Purpose |
|-----------|----------|---------|
| **Long** | 60 days (configurable) | Established phase — what has been happening |
| **Short** | 20 days (fixed) | Emerging phase — what is starting to happen |

**Transition detection:** When short and long disagree, a transition is in progress. The `activePhase` uses the short timeframe (more responsive), but the dashboard shows the transition clearly: `» MID EXPANSION (was EARLY RECOVERY)`.

#### Sector Fit Matching

| Condition | Label | Color | Meaning |
|-----------|-------|-------|---------|
| Stock's sector favored in current phase | FAVORED | 🟢 | Tailwind — cycle supports this sector |
| Favored + transitioning into this phase | ROTATING IN | 🟢 | Smart entry — cycle is moving toward this sector |
| Favored in next phase | SMART MONEY | 🔵 | Early positioning — institutions rotate early |
| Transitioning + not favored | ROTATING OUT | 🟠 | Headwind building — consider reducing |
| Not favored in any phase | OUT OF FAVOR | 🔴 | Cycle headwind — sector swimming upstream |

The sector matching uses `syminfo.sector` which returns the stock's GICS-like sector classification from TradingView's data provider. Multiple string variants are checked (e.g., "Technology", "Technology Services", "Electronic Technology") because different data providers use different naming conventions.

### 11. Technical Analysis Engine

#### Moving Averages

| Indicator | Period | Timeframe | Purpose |
|-----------|--------|-----------|---------|
| SMA 50 | 50 bars | Chart TF | Momentum / intermediate trend |
| SMA 200 | 200 bars | Chart TF | Long-term trend / institutional reference |
| Weekly SMA 10 | 10 weeks | Weekly | Weekly momentum (≈ 50-day daily) |
| Weekly SMA 40 | 40 weeks | Weekly | Weekly trend (≈ 200-day daily) |

**Color logic for 50 SMA:**
- Rising AND above 200 SMA → 🔵 Blue (bullish + golden cross)
- Rising AND below 200 SMA → 🟠 Orange (recovering but below trend)
- Falling → 🔴 Red (bearish momentum)

#### ADX Implementation (Wilder's Original)

```
True Range    = max(high−low, |high−prev_close|, |low−prev_close|)
DM+           = max(high − prev_high, 0)  [only if > DM−]
DM−           = max(prev_low − low, 0)    [only if > DM+]
Smoothed TR   = RMA(TR, 14)
DI+           = (RMA(DM+, 14) / Smoothed_TR) × 100
DI−           = (RMA(DM−, 14) / Smoothed_TR) × 100
DX            = |DI+ − DI−| / (DI+ + DI−) × 100
ADX           = RMA(DX, 14)
```

**Note:** Uses `ta.rma()` (Wilder's smoothing = exponential moving average with α = 1/length) which matches Wilder's original specification.

#### Volume Analysis

| Condition | Label | Color | Interpretation |
|-----------|-------|-------|----------------|
| Max volume (5 bars) > threshold × avg AND price rising above MA50 | ACCUMULATION | 🟢 | Institutions buying — bullish |
| Max volume (5 bars) > threshold × avg AND NOT above conditions | DISTRIBUTION | 🔴 | Institutions selling — bearish |
| Volume normal | STABLE | 🔵 | No unusual institutional activity |

**Why 5-bar max?** A single spike might be noise (earnings, ex-dividend). The 5-bar maximum captures a sustained volume cluster, which better indicates institutional activity.

#### Stop Loss Calculation

```
stopATR  = close − (ATR × 2)
stopBase = lowest low of base period
stopLevel = MAX(stopATR, stopBase)
```

**Justification:**
- **ATR-based stop**: 2× ATR below current price gives the stock "breathing room" for normal volatility while protecting against abnormal moves. This is a standard approach in trend-following (used by Turtle Traders, Keltner Channels)
- **Base floor**: The lowest low of the lookback period acts as a structural support level
- **MAX of both**: Takes the higher (tighter) of the two stops, providing the more conservative protection

#### Risk-Reward Ratio

```
Risk     = close − stopLevel
Reward   = highestHigh − close
R:R      = Reward / Risk
```

| R:R | Color | Interpretation |
|-----|-------|----------------|
| ≥ 2.0 | 🟢 Green | Favorable — textbook minimum for trend trades |
| 1.0 – 1.9 | 🟠 Orange | Acceptable with high win rate |
| < 1.0 | 🔴 Red | Unfavorable — risk exceeds potential reward |

### 12. Signal Generation System

#### Entry Signal

An entry signal requires ALL of the following conditions simultaneously:

```
ENTRY = Breakout + Volume + Trend + Fundamentals + Momentum + Multi-TF + Cooldown
```

| # | Condition | Code | Rationale |
|---|-----------|------|-----------|
| 1 | Price crosses above prior highest high | `ta.crossover(close, highestHigh[1])` | CAN SLIM breakout from base |
| 2 | Volume > 1.2× average | `volume > avgVol * 1.2` | Institutional participation |
| 3 | Price above 50 SMA | `close > ma50` | Medium-term uptrend confirmed |
| 4 | Price above 200 SMA | `close > ma200` | Long-term uptrend confirmed |
| 5 | Company is profitable | `isProfitable` | Fundamental quality filter |
| 6 | ADX confirms trend | `isTrending` | Avoid false breakouts in chop |
| 7 | RSI not overbought | `rsiVal < rsiOB` | Avoid buying exhaustion moves |
| 8 | Weekly trend bullish | `weeklyBullish` | Multi-timeframe confirmation |
| 9 | Cooldown elapsed | `bar_index - lastEntryBar >= cooldownBars` | Prevent signal spam |

**Why so many filters?** Each filter eliminates a class of false signals:

- Filters 1–2: Eliminate low-conviction breakouts
- Filters 3–4: Eliminate counter-trend trades
- Filter 5: Eliminates fundamentally unsound companies
- Filter 6: Eliminates range-bound fake breakouts
- Filter 7: Eliminates late/exhaustion entries
- Filter 8: Eliminates daily noise against weekly downtrend
- Filter 9: Prevents overtrading

#### Warning Signal

Warning signals have fewer filters (you want to know about danger quickly):

```
WARNING = MA50 Crossunder + Volume Surge + Cooldown
```

| # | Condition | Code | Rationale |
|---|-----------|------|-----------|
| 1 | Price crosses below 50 SMA | `ta.crossunder(close, ma50)` | Loss of momentum support |
| 2 | Volume > 1.1× average | `volume > avgVol * 1.1` | Confirms selling pressure (lower threshold than entry — better safe than sorry) |
| 3 | Cooldown elapsed | `bar_index - lastWarningBar >= cooldownBars` | Prevent alarm fatigue |

### 13. Probability Engine

#### Probability of Warning (5-day)

```
expectedMove = close × σ × √5
distToMA50   = close − MA50

warnProb = min(100, (expectedMove / distToMA50) × 50)
```

**Interpretation:** "Given current volatility, how likely is price to reach the 50 SMA within 5 trading days?"

| Probability | Color | Meaning |
|-------------|-------|---------|
| > 70% | 🔴 Red | Price is very close to MA50 relative to volatility — warning likely |
| 40–70% | 🟠 Orange | Moderate risk of MA50 test |
| < 40% | 🟢 Green | Price is far above MA50 — warning unlikely |

**Edge cases:**
- `distToMA50 ≤ 0` → probability = 100% (already below MA50)
- `distToMA50 = na` → probability = `na`

#### Probability of Entry (5-day)

```
distToHigh = highestHigh − close

entryProb = min(100, (expectedMove / distToHigh) × 50)
```

**Interpretation:** "Given current volatility, how likely is price to reach the breakout level within 5 trading days?"

| Probability | Color | Meaning |
|-------------|-------|---------|
| > 70% | 🟢 Green | Price is close to breakout — entry signal likely |
| 40–70% | 🟠 Orange | Moderate chance of breakout |
| < 40% | 🔴 Red | Price is far from breakout level |

**Note:** The `× 50` scaling factor is calibrated so that when the expected move equals the distance to the target, probability reads ~50%. This is consistent with a symmetric distribution assumption.

### 14. Visualization & Dashboard

#### Chart Overlays

| Element | Color | Width | Style | Purpose |
|---------|-------|-------|-------|---------|
| 50 SMA | Blue/Orange/Red (dynamic) | 2 | Line | Momentum trend |
| 200 SMA | White | 3 | Line | Long-term trend (thick = important) |
| Stop Level | Red (60% transparent) | 1 | Cross | Suggested stop-loss |
| Bull Target | Green (40% transparent) | 1 | Line | 1-year optimistic target |
| Fair Value | Yellow (40% transparent) | 2 | Line | 1-year base-case target |
| Bear Target | Red (40% transparent) | 1 | Line | 1-year pessimistic target |
| Base Zone | Gray (90% transparent) | — | Background | Consolidation range (<15% height) |

#### Signal Labels

| Signal | Shape | Position | Color | Size |
|--------|-------|----------|-------|------|
| ENTRY | Label Up ▲ | Below bar | 🟢 Green | Small |
| WARNING | Label Down ▼ | Above bar | 🔴 Red | Small |

#### Dashboard Table (up to 27 active rows)

| Row | Label | Content | Dynamic Color |
|-----|-------|---------|---------------|
| 0 | ⚠ WARNINGS | Count/9 + warning text | Green/Orange/Red |
| 1 | FUND. GRADE | A+ through F + score | Green/Blue/Orange/Red |
| 2 | GAAP PROFIT | Yes/Cash Prof./No + amount | Green/Blue/Red |
| 3 | EPS (FY) | EPS value | Green/Red/Gray |
| 4 | REVENUE | CAGR trend + period + percentage | Green/Blue/Red/Orange |
| 5 | FCF TREND | CAGR trend + period + percentage | Green/Blue/Red |
| 6* | 📋/⚠ PHASE | Restructured/Investing/Deteriorating | Orange/Red |
| 7 | P/FCF (NOW) | Ratio + HIGH warning | Green/Blue/Orange/Red |
| 8 | FORECAST BASIS | Growth rate + adjustment label | Gray/Orange/Red |
| 9 | 1Y BEAR | Price + upside % | Green/Red |
| 10 | 1Y FAIR | Price + upside % | Green/Red |
| 11 | 1Y BULL | Price + upside % | Green/Red |
| 12 | TREND | Bullish/Bearish | Green/Red |
| 13 | WEEKLY TREND | Bullish/Bearish | Green/Red |
| 14 | ADX (TREND) | Value + Trending/Choppy | Green/Gray |
| 15 | RSI | Value + OB/OS label | Red/Green/Blue |
| 16 | VOLUME | Accumulation/Distribution/Stable | Green/Red/Blue |
| 17 | RS vs COMP | Stronger/Weaker | Green/Red |
| 18 | CYCLE PHASE | Phase name + transition | Green/Blue/Orange/Red |
| 19 | SECTOR FIT | Fit label + sector name | Green/Blue/Orange/Red |
| 20 | NEXT PHASE | Upcoming phase | Green/Blue/Orange/Red |
| 21 | PROB. WARNING | 5-day % probability | Red/Orange/Green |
| 22 | PROB. ENTRY | 5-day % probability | Green/Orange/Red |
| 23 | DIST. TO MA50 | Percentage distance | Green/Red |
| 24 | DIST. TO MA200 | Percentage distance | Green/Red |
| 25 | STOP / R:R | Stop price + risk-reward ratio | Green/Orange/Red |

*Row 6 is conditional — only appears for restructured, investing, or deteriorating companies.

---

## Signal Logic Flowchart

```
                          ┌─────────────┐
                          │  NEW BAR    │
                          └──────┬──────┘
                                 ▼
                    ┌────────────────────────┐
                    │ Price > Prior Highest   │──No──►(no entry signal)
                    │ High? (Breakout)        │
                    └────────────┬────────────┘
                                 │ Yes
                                 ▼
                    ┌────────────────────────┐
                    │ Volume > 1.2× Average? │──No──►(no entry signal)
                    └────────────┬────────────┘
                                 │ Yes
                                 ▼
                    ┌────────────────────────┐
                    │ Price > MA50 AND MA200?│──No──►(no entry signal)
                    └────────────┬────────────┘
                                 │ Yes
                                 ▼
                    ┌────────────────────────┐
                    │ Company Profitable?     │──No──►(no entry signal)
                    │ (GAAP or Cash)         │
                    └────────────┬────────────┘
                                 │ Yes
                                 ▼
                    ┌────────────────────────┐
                    │ ADX > Threshold?       │──No──►(no entry signal)
                    │ (Trending market)      │
                    └────────────┬────────────┘
                                 │ Yes
                                 ▼
                    ┌────────────────────────┐
                    │ RSI < Overbought?      │──No──►(no entry signal)
                    └────────────┬────────────┘
                                 │ Yes
                                 ▼
                    ┌────────────────────────┐
                    │ Weekly Trend Bullish?   │──No──►(no entry signal)
                    │ (10W SMA > 40W SMA)    │
                    └────────────┬────────────┘
                                 │ Yes
                                 ▼
                    ┌────────────────────────┐
                    │ Cooldown Elapsed?       │──No──►(no entry signal)
                    │ (≥ N bars since last)  │
                    └────────────┬────────────┘
                                 │ Yes
                                 ▼
                         ┌──────────────┐
                         │ 🟢 ENTRY     │
                         │    SIGNAL    │
                         └──────────────┘
```

```
                          ┌─────────────┐
                          │  NEW BAR    │
                          └──────┬──────┘
                                 ▼
                    ┌────────────────────────┐
                    │ Price crosses below    │──No──►(no warning)
                    │ 50 SMA?               │
                    └────────────┬────────────┘
                                 │ Yes
                                 ▼
                    ┌────────────────────────┐
                    │ Volume > 1.1× Average? │──No──►(no warning)
                    └────────────┬────────────┘
                                 │ Yes
                                 ▼
                    ┌────────────────────────┐
                    │ Cooldown Elapsed?       │──No──►(no warning)
                    └────────────┬────────────┘
                                 │ Yes
                                 ▼
                         ┌──────────────┐
                         │ 🔴 WARNING   │
                         │    SIGNAL    │
                         └──────────────┘
```

---

## Limitations & Disclaimers

### Technical Limitations

1. **Financial data availability**: `request.financial()` coverage varies by exchange and data provider. Non-US stocks may have incomplete data, causing many indicators to show "N/A"
2. **Sector classification**: `syminfo.sector` strings vary by data provider. Some stocks, ETFs, indices, forex, and crypto may return empty strings
3. **Request call budget**: ~18 of 40 allowed `request.*()` calls are used. Adding more data feeds requires removing existing ones
4. **Backtest reliability**: Financial data is "as reported" — it doesn't reflect what was known at the time. Fundamental signals may appear earlier in backtesting than they would have in real-time
5. **Timeframe dependency**: The script is designed for daily charts. Using it on intraday timeframes will produce unreliable financial ratios and sector rotation data

### Analytical Limitations

1. **P/FCF forecasts are not predictions**: They represent "if current trends continue, what is a reasonable price range?" — not "where will the stock be"
2. **Sector rotation is backward-looking**: The model detects what has happened, not what will happen. Phase transitions take weeks to confirm
3. **Probability estimates assume log-normal returns**: Real markets exhibit fat tails, jumps, and regime changes that this model does not capture
4. **No consideration of macro events**: The script cannot predict or react to earnings surprises, Fed decisions, geopolitical events, or black swan events
5. **Survivorship bias**: The script only analyzes currently listed stocks. It cannot assess the risk of delisting or bankruptcy

### Disclaimer

> This indicator is for **educational and informational purposes only**. It does not constitute financial advice, a recommendation to buy or sell, or an offer of any security. Past performance does not guarantee future results. Always conduct your own research and consult a licensed financial advisor before making investment decisions.

---

## References & Further Reading

### Books

| # | Title | Author | Year | Relevance |
|---|-------|--------|------|-----------|
| 1 | *How to Make Money in Stocks* | William J. O'Neil | 1988 (4th ed. 2009) | CAN SLIM methodology, breakout trading, volume analysis |
| 2 | *Investment Valuation* | Aswath Damodaran | 2012 (3rd ed.) | DCF valuation, growth rate estimation, decay of high growth |
| 3 | *New Concepts in Technical Trading Systems* | J. Welles Wilder Jr. | 1978 | ADX, RSI, ATR — original specifications |
| 4 | *Standard & Poor's Guide to Sector Investing* | Sam Stovall | 1996 | Sector rotation theory, business cycle phases |
| 5 | *The All-Season Investor* | Martin J. Pring | 1992 | Business cycle investing, sector rotation timing |
| 6 | *The Intelligent Investor* | Benjamin Graham | 1949 (rev. 2003) | Margin of safety concept underlying bear/bull price bands |
| 7 | *One Up on Wall Street* | Peter Lynch | 1989 | Growth at a reasonable price (GARP), PEG ratio concepts |

### Online Resources

| Resource | URL | Relevance |
|----------|-----|-----------|
| Damodaran Online | https://pages.stern.nyu.edu/~adamodar/ | Valuation models, growth rate tables, cost of capital |
| Investor's Business Daily | https://www.investors.com/ibd-university/can-slim/ | CAN SLIM methodology details |
| Fidelity Sector Rotation | https://www.fidelity.com/learning-center/trading-investing/markets-sectors/business-cycle-702702 | Business cycle sector mapping |
| StockCharts Sector Rotation | https://school.stockcharts.com/doku.php?id=market_analysis:sector_rotation_model | Visual sector rotation model |
| Investopedia — ADX | https://www.investopedia.com/terms/a/adx.asp | ADX calculation and interpretation |
| Investopedia — RSI | https://www.investopedia.com/terms/r/rsi.asp | RSI calculation and interpretation |
| Investopedia — ATR | https://www.investopedia.com/terms/a/atr.asp | ATR calculation and usage |
| Investopedia — Log-Normal | https://www.investopedia.com/terms/l/log-normal-distribution.asp | Statistical basis for probability engine |
| TradingView Pine Script v6 Reference | https://www.tradingview.com/pine-script-reference/v6/ | Language reference for all Pine functions used |
| TradingView Financial Data | https://www.tradingview.com/pine-script-docs/concepts/Request_functions/#request-financial | Documentation for `request.financial()` fields |

### Academic Papers

| Paper | Authors | Year | Relevance |
|-------|---------|------|-----------|
| "The Pricing of Options and Corporate Liabilities" | Black, F. & Scholes, M. | 1973 | Log-normal return assumption used in probability engine |
| "The Cross-Section of Expected Stock Returns" | Fama, E. & French, K. | 1992 | Value/growth factor analysis underlying P/FCF approach |
| "Momentum" | Jegadeesh, N. & Titman, S. | 1993 | Academic validation of momentum strategies (RS, MA crossovers) |
| "Sector Rotation over Business Cycles" | Stangl, J., Jacobsen, B., & Visaltanachoti, N. | 2009 | Empirical evidence for sector rotation profitability |

---

*Document version: 10.0 — corresponding to script version V10*
*Script language: Pine Script v6 (TradingView)*
*Maximum `request.*()` calls: ~18 of 40*
*Dashboard rows: up to 27 active (30 allocated)*