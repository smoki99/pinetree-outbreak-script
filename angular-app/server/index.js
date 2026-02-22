import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

app.use(cors());
app.use(express.json());

/** Normalize symbol to plain ticker for Yahoo (e.g. NASDAQ:PLTR → PLTR, strip parentheses) */
function toTicker(symbol) {
  const s = (symbol || '').trim();
  const afterColon = s.includes(':') ? s.split(':')[1]?.trim() : s;
  const ticker = (afterColon || s).replace(/\s*\([^)]*\)\s*$/, '').trim();
  return ticker.toUpperCase() || s.toUpperCase();
}

/** Get cookie and crumb from Yahoo Finance quote page for quoteSummary API */
async function getYahooCrumbAndCookie(symbol) {
  const url = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;
  const resp = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!resp.ok) throw new Error(`Yahoo quote page ${resp.status}`);
  const html = await resp.text();
  const cookies = resp.headers.getSetCookie ? resp.headers.getSetCookie() : [];
  const cookie = cookies.length ? cookies.map((c) => c.split(';')[0]).join('; ') : '';

  let crumb = null;
  const crumbStoreMatch = html.match(/"CrumbStore":\s*\{\s*"crumb":"([^"]+)"\s*\}/);
  if (crumbStoreMatch) crumb = crumbStoreMatch[1];
  if (!crumb) {
    const mainMatch = html.match(/root\.App\.main\s*=\s*(\{.*?\});\s*$/m);
    if (mainMatch) {
      try {
        const data = JSON.parse(mainMatch[1]);
        crumb = data?.context?.dispatcher?.stores?.CrumbStore?.crumb
          || data?.context?.plugins?.ServicePlugin?.xhrContext?.crumb;
      } catch (_) {}
    }
  }
  if (!crumb) throw new Error('Could not extract crumb from Yahoo');
  return { crumb: decodeURIComponent(crumb), cookie };
}

/** Fetch quoteSummary from Yahoo (requires valid cookie + crumb) */
async function fetchQuoteSummary(symbol, crumb, cookie) {
  const modules = [
    'summaryDetail',
    'summaryProfile',
    'incomeStatementHistory',
    'incomeStatementHistoryQuarterly',
    'cashflowStatementHistory',
    'cashflowStatementHistoryQuarterly',
    'balanceSheetHistory',
    'balanceSheetHistoryQuarterly',
  ].join(',');
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?formatted=true&crumb=${encodeURIComponent(crumb)}&modules=${encodeURIComponent(modules)}`;
  const resp = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Cookie: cookie,
    },
  });
  if (!resp.ok) throw new Error(`quoteSummary ${resp.status}`);
  const data = await resp.json();
  const err = data?.quoteSummary?.error;
  if (err) throw new Error(err.description || 'quoteSummary error');
  return data?.quoteSummary?.result?.[0] || null;
}

/** Map quoteSummary result to our Fundamentals shape */
function mapQuoteSummaryToFundamentals(symbol, qs) {
  const num = (v) => (v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null);
  const arr = (list, getter, max = 5) => {
    if (!Array.isArray(list)) return [];
    return list.slice(0, max).map((x) => num(getter(x))).filter((x) => x != null);
  };

  const summary = qs?.summaryDetail || {};
  const profile = qs?.summaryProfile || {};
  const incomeHist = qs?.incomeStatementHistory?.incomeStatementHistory || [];
  const incomeQ = qs?.incomeStatementHistoryQuarterly?.incomeStatementHistoryQuarterly || [];
  const cashflowHist = qs?.cashflowStatementHistory?.cashflowStatementHistory || [];
  const cashflowQ = qs?.cashflowStatementHistoryQuarterly?.cashflowStatementHistoryQuarterly || [];
  const balanceHist = qs?.balanceSheetHistory?.balanceSheetHistory || [];
  const balanceQ = qs?.balanceSheetHistoryQuarterly?.balanceSheetHistoryQuarterly || [];

  const latestIncome = incomeHist[0] || incomeQ[0];
  const latestCashflow = cashflowHist[0] || cashflowQ[0];
  const latestBalance = balanceHist[0] || balanceQ[0];

  const netIncome = num(latestIncome?.netIncome ?? latestIncome?.netIncomeCommonStockholders);
  const revenue = num(latestIncome?.totalRevenue ?? latestIncome?.revenue);
  const fcf = num(latestCashflow?.freeCashFlow);
  const equity = num(latestBalance?.totalStockholderEquity ?? latestBalance?.totalEquityGrossMinorityInterest);
  const totalDebt = num(latestBalance?.totalDebt);
  const sharesOutstanding = num(summary?.sharesOutstanding);
  const eps = num(summary?.trailingEps ?? latestIncome?.basicEps ?? latestIncome?.dilutedEps);

  const revenueHistory = arr(incomeHist, (x) => x.totalRevenue ?? x.revenue);
  const netIncomeHistory = arr(incomeHist, (x) => x.netIncome ?? x.netIncomeCommonStockholders, 5);
  const fcfHistory = arr(cashflowHist, (x) => x.freeCashFlow);
  const equityHistory = arr(balanceHist, (x) => x.totalStockholderEquity ?? x.totalEquityGrossMinorityInterest);
  const epsHistory = arr(incomeHist, (x) => x.basicEps ?? x.dilutedEps ?? x.netIncome / (summary?.sharesOutstanding || 1));

  const sector = profile?.sector || profile?.industry || null;

  return {
    ticker: symbol,
    sector: sector || null,
    netIncome,
    eps,
    fcf,
    equity,
    totalDebt,
    revenue,
    sharesOutstanding,
    fcfHistory,
    revenueHistory,
    equityHistory,
    epsHistory,
    netIncomeHistory,
  };
}

/** Candles: GET /api/candles?symbol=PLTR&from=...&to=... (Unix seconds) — Yahoo Chart API */
app.get('/api/candles', async (req, res) => {
  try {
    const symbol = toTicker(req.query.symbol || '');
    if (!symbol) {
      return res.status(400).json({ error: 'Missing symbol' });
    }
    const from = parseInt(req.query.from, 10) || 0;
    const to = parseInt(req.query.to, 10) || Math.floor(Date.now() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${from}&period2=${to}&interval=1d`;
    const resp = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!resp.ok) {
      console.warn('/api/candles Yahoo returned', resp.status, '— returning empty');
      return res.json([]);
    }
    const data = await resp.json().catch(() => ({}));
    const result = data?.chart?.result?.[0];
    if (!result) {
      return res.json([]);
    }
    const ts = result.timestamp || [];
    const q = result.indicators?.quote?.[0] || {};
    const opens = q.open || [];
    const highs = q.high || [];
    const lows = q.low || [];
    const closes = q.close || [];
    const vols = q.volume || [];
    const bars = ts.map((t, i) => ({
      time: t,
      open: opens[i] ?? 0,
      high: highs[i] ?? 0,
      low: lows[i] ?? 0,
      close: closes[i] ?? 0,
      volume: vols[i] ?? 0,
    }));
    bars.sort((a, b) => a.time - b.time);
    res.json(bars);
  } catch (err) {
    console.error('/api/candles', err.message);
    res.json([]);
  }
});

/** Fundamentals: GET /api/fundamentals?symbol=PLTR — real data via Yahoo quoteSummary when crumb works; else stub */
app.get('/api/fundamentals', async (req, res) => {
  try {
    const symbol = toTicker(req.query.symbol || '');
    if (!symbol) {
      return res.status(400).json({ error: 'Missing symbol' });
    }

    const stubFromChart = (meta) => ({
      ticker: symbol,
      sector: meta?.sector || meta?.industry || null,
      netIncome: null,
      eps: null,
      fcf: null,
      equity: null,
      totalDebt: null,
      revenue: null,
      sharesOutstanding: null,
      fcfHistory: [],
      revenueHistory: [],
      equityHistory: [],
      epsHistory: [],
      netIncomeHistory: [],
    });

    try {
      const { crumb, cookie } = await getYahooCrumbAndCookie(symbol);
      const qs = await fetchQuoteSummary(symbol, crumb, cookie);
      if (qs) {
        const fundamentals = mapQuoteSummaryToFundamentals(symbol, qs);
        return res.json(fundamentals);
      }
    } catch (_qsErr) {
      // Yahoo crumb unavailable; stub fundamentals used. No log — keeps terminal clean.
    }

    const to = Math.floor(Date.now() / 1000);
    const from = to - 365 * 24 * 60 * 60;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${from}&period2=${to}&interval=1d`;
    const resp = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!resp.ok) {
      return res.json(stubFromChart({}));
    }
    const data = await resp.json().catch(() => ({}));
    const result = data?.chart?.result?.[0];
    const meta = result?.meta || {};
    res.json(stubFromChart(meta));
  } catch (err) {
    if (!/crumb|quoteSummary/i.test(err?.message || '')) {
      console.error('/api/fundamentals', err.message);
    }
    const symbol = toTicker(req.query.symbol || '') || 'UNKNOWN';
    res.json({
      ticker: symbol,
      sector: null,
      netIncome: null,
      eps: null,
      fcf: null,
      equity: null,
      totalDebt: null,
      revenue: null,
      sharesOutstanding: null,
      fcfHistory: [],
      revenueHistory: [],
      equityHistory: [],
      epsHistory: [],
      netIncomeHistory: [],
    });
  }
});

app.listen(PORT, () => {
  console.log(`Yahoo API server at http://localhost:${PORT}`);
});
