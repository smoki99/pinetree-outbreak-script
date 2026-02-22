/**
 * Common symbols for the dropdown. Format: EXCHANGE:TICKER
 * Users can also type a custom symbol (e.g. NASDAQ:PLTR, NYSE:AAPL).
 */
export const SYMBOLS: { value: string; label: string }[] = [
  { value: 'NASDAQ:AAPL', label: 'AAPL (Apple)' },
  { value: 'NASDAQ:MSFT', label: 'MSFT (Microsoft)' },
  { value: 'NASDAQ:GOOGL', label: 'GOOGL (Alphabet)' },
  { value: 'NASDAQ:AMZN', label: 'AMZN (Amazon)' },
  { value: 'NASDAQ:META', label: 'META (Meta)' },
  { value: 'NASDAQ:NVDA', label: 'NVDA (NVIDIA)' },
  { value: 'NASDAQ:TSLA', label: 'TSLA (Tesla)' },
  { value: 'NASDAQ:PLTR', label: 'PLTR (Palantir)' },
  { value: 'NASDAQ:AMD', label: 'AMD' },
  { value: 'NASDAQ:INTC', label: 'INTC (Intel)' },
  { value: 'NASDAQ:NFLX', label: 'NFLX (Netflix)' },
  { value: 'NASDAQ:AVGO', label: 'AVGO (Broadcom)' },
  { value: 'NYSE:BRK.B', label: 'BRK.B (Berkshire)' },
  { value: 'NYSE:JPM', label: 'JPM (JPMorgan)' },
  { value: 'NYSE:V', label: 'V (Visa)' },
  { value: 'NYSE:UNH', label: 'UNH (UnitedHealth)' },
  { value: 'NYSE:JNJ', label: 'JNJ (Johnson & Johnson)' },
  { value: 'NYSE:WMT', label: 'WMT (Walmart)' },
  { value: 'NYSE:MA', label: 'MA (Mastercard)' },
  { value: 'NYSE:PG', label: 'PG (Procter & Gamble)' },
  { value: 'NYSE:HD', label: 'HD (Home Depot)' },
  { value: 'NYSE:CVX', label: 'CVX (Chevron)' },
  { value: 'NYSE:MRK', label: 'MRK (Merck)' },
  { value: 'NYSE:ABBV', label: 'ABBV (AbbVie)' },
  { value: 'NYSE:LLY', label: 'LLY (Eli Lilly)' },
  { value: 'NYSE:KO', label: 'KO (Coca-Cola)' },
  { value: 'NYSE:PEP', label: 'PEP (PepsiCo)' },
  { value: 'AMEX:SPY', label: 'SPY (S&P 500 ETF)' },
  { value: 'AMEX:QQQ', label: 'QQQ (Nasdaq 100 ETF)' },
  { value: 'AMEX:XLK', label: 'XLK (Tech Sector)' },
  { value: 'AMEX:XLF', label: 'XLF (Financials)' },
  { value: 'TVC:US10Y', label: 'US10Y (10Y Treasury)' },
  { value: 'TVC:US02Y', label: 'US02Y (2Y Treasury)' },
];

export const DEFAULT_SYMBOL = 'NASDAQ:PLTR';
