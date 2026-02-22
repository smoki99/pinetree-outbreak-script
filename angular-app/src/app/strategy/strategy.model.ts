/** Output of strategy run for dashboard and chart */
export interface StrategyResult {
  // Technical
  close: number;
  ma50: number | null;
  ma200: number | null;
  ma50Rising: boolean;
  rsi: number | null;
  adx: number | null;
  isTrending: boolean;
  avgVol: number | null;
  volStatus: 'STABLE' | 'ACCUMULATION' | 'DISTRIBUTION';
  stopLevel: number | null;
  rrRatio: number | null;
  distToMA50Pct: number | null;
  distToMA200Pct: number | null;
  // Valuation
  valuationModel: string;
  activeMetricName: string;
  activeMultiple: number | null;
  // Warnings
  warnCount: number;
  warnText: string;
  warnCountColor: 'green' | 'orange' | 'red';
  // Grade & profit
  fundScore: number;
  fundGrade: string;
  fundGradeColor: 'green' | 'blue' | 'orange' | 'red';
  isProfitable: boolean;
  profitLabel: string;
  profitColor: 'green' | 'blue' | 'red';
  eps: number | null;
  // Trends
  revTrend: string;
  revColor: 'green' | 'red' | 'blue' | 'orange' | 'gray';
  fcfTrend: string;
  fcfColor: 'green' | 'red' | 'blue' | 'orange' | 'gray';
  // Forecast
  forecastValid: boolean;
  priceBear: number | null;
  priceFair: number | null;
  priceBull: number | null;
  upsideBear: number | null;
  upsideFair: number | null;
  upsideBull: number | null;
  forecastBasisText: string;
  // Chart series (for Lightweight Charts)
  sma50Series: { time: number; value: number }[];
  sma200Series: { time: number; value: number }[];
  bearSeries: { time: number; value: number }[];
  fairSeries: { time: number; value: number }[];
  bullSeries: { time: number; value: number }[];
  stopSeries: { time: number; value: number }[];
  entryIndices: number[];
  warningIndices: number[];
  // Sector (simplified - can add phase later)
  sector: string | null;
  sectorFitLabel: string;
  sectorFitColor: string;
  cyclePhase: string;
  nextPhase: string;
  /** Phase label with FCF/revenue context (e.g. CYCLICAL BOOM) */
  phaseLabel: string;
  /** Weekly timeframe trend: BULLISH / BEARISH */
  weeklyTrend: string;
  /** Relative strength vs benchmark (e.g. RS vs BATS): STRONGER / WEAKER / NO DATA */
  rsVsBenchmark: string;
  // Probabilities
  warnProb: number | null;
  entryProb: number | null;
}
