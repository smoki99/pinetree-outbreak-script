/** OHLCV bar for chart and technicals */
export interface Bar {
  time: number; // Unix timestamp, day start
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Company profile (sector, name) */
export interface CompanyProfile {
  name: string;
  ticker: string;
  sector: string | null;
  industry: string | null;
}

/** Annual/quarterly financials for strategy */
export interface Fundamentals {
  ticker: string;
  sector: string | null;
  /** Net income TTM or latest FY */
  netIncome: number | null;
  /** EPS TTM or latest FY */
  eps: number | null;
  /** Free cash flow TTM or latest FY */
  fcf: number | null;
  /** Total equity (book value) latest */
  equity: number | null;
  /** Total debt latest */
  totalDebt: number | null;
  /** Revenue TTM or latest FY */
  revenue: number | null;
  /** Shares outstanding */
  sharesOutstanding: number | null;
  /** FCF last 5 years [y0, y1, y2, y3, y4] (y0 = latest) */
  fcfHistory: number[];
  /** Revenue last 5 years */
  revenueHistory: number[];
  /** Equity last 5 years */
  equityHistory: number[];
  /** EPS last 5 years */
  epsHistory: number[];
  /** Net income last 2 years for dilution */
  netIncomeHistory: number[];
}
