import { Injectable } from '@angular/core';
import { Bar } from '../models/data';
import { Fundamentals } from '../models/data';
import { StrategyResult } from './strategy.model';
import * as ind from './indicators';

const SMA_FAST = 50;
const SMA_SLOW = 200;
const ADX_LEN = 14;
const ADX_THRESHOLD = 20;
const RSI_LEN = 14;
const RSI_OB = 75;
const ATR_LEN = 14;
const BASE_LOOKBACK = 50;
const VOL_THRESHOLD = 1.5;
const COOLDOWN_BARS = 10;

function nz(x: number | null | undefined): number {
  return x ?? 0;
}

function growthCAGR(
  current: number | null,
  y1: number | null,
  y2: number | null,
  y3: number | null,
  y4: number | null
): { cagr: number | null; period: string } {
  if (current == null || current <= 0) return { cagr: null, period: 'N/A' };
  if (y4 != null && y4 > 0 && current > 0) {
    const cagr = (Math.pow(current / y4, 1 / 4) - 1) * 100;
    return { cagr, period: '4Y' };
  }
  if (y3 != null && y3 > 0 && current > 0) {
    const cagr = (Math.pow(current / y3, 1 / 3) - 1) * 100;
    return { cagr, period: '3Y' };
  }
  if (y2 != null && y2 > 0 && current > 0) {
    const cagr = (Math.pow(current / y2, 1 / 2) - 1) * 100;
    return { cagr, period: '2Y' };
  }
  if (y1 != null && y1 > 0 && current > 0) {
    const cagr = (current / y1 - 1) * 100;
    return { cagr, period: '1Y' };
  }
  return { cagr: null, period: 'N/A' };
}

function decayGrowth(rawCAGR: number): number {
  if (rawCAGR > 50) return 35 + (rawCAGR - 50) * 0.25;
  if (rawCAGR > 20) return 20 + (rawCAGR - 20) * 0.5;
  return rawCAGR;
}

@Injectable({ providedIn: 'root' })
export class StrategyService {
  run(bars: Bar[], fundamentals: Fundamentals | null): StrategyResult {
    const closes = bars.map((b) => b.close);
    const highs = bars.map((b) => b.high);
    const lows = bars.map((b) => b.low);
    const volumes = bars.map((b) => b.volume);
    const times = bars.map((b) => b.time);

    const sma50Arr = ind.sma(closes, SMA_FAST);
    const sma200Arr = ind.sma(closes, SMA_SLOW);
    const sma20Arr = ind.sma(closes, 20);
    const rsiArr = ind.rsi(closes, RSI_LEN);
    const atrArr = ind.atr(highs, lows, closes, ATR_LEN);
    const adxArr = ind.adx(highs, lows, closes, ADX_LEN);
    const highestHigh = ind.highest(highs, BASE_LOOKBACK);
    const lowestLow = ind.lowest(lows, BASE_LOOKBACK);
    const avgVolArr = ind.sma(volumes, 50);

    const last = bars.length - 1;
    const close = closes[last] ?? 0;
    const ma50 = sma50Arr[last] ?? null;
    const ma200 = sma200Arr[last] ?? null;
    const ma50Rising = (ma50 != null && sma50Arr[last - 5] != null && ma50 > (sma50Arr[last - 5] ?? 0));
    const rsiVal = rsiArr[last] ?? null;
    const adxVal = adxArr[last] ?? null;
    const isTrending = (adxVal != null && adxVal > ADX_THRESHOLD);
    const avgVol = avgVolArr[last] ?? null;
    const highestHighLast = highestHigh[last] ?? null;
    const lowestLowLast = lowestLow[last] ?? null;
    const atrVal = atrArr[last] ?? null;

    let sector: string | null = null;
    let isBank = false;
    let isUtility = false;
    let valuationModel = 'FCF';
    let netIncome: number | null = null;
    let fcfEffective: number | null = null;
    let eps: number | null = null;
    let curEquity: number | null = null;
    let revTTM: number | null = null;
    let totalDebt: number | null = null;
    let sharesOut: number | null = null;
    let revCAGR: number | null = null;
    let fcfCAGR: number | null = null;
    let eqCAGR: number | null = null;
    let epsCAGR: number | null = null;
    let revValid = false;
    let fcfValid = false;
    let eqValid = false;
    let epsValid = false;
    let isRestructured = false;
    let isInvestmentPhase = false;
    let isProfitable = false;
    let profitLabel = 'NO';
    let profitColor: 'green' | 'blue' | 'red' = 'red';
    let epsDisplay: number | null = null;
    let revTrend = 'NO DATA';
    let revColor: 'green' | 'red' | 'blue' | 'orange' | 'gray' = 'gray';
    let fcfTrend = 'NO DATA';
    let fcfColor: 'green' | 'red' | 'blue' | 'orange' | 'gray' = 'gray';
    let activeMetric = 0;
    let activeMultiple: number | null = null;
    let activeMetricName = 'P/FCF';
    let warnDilution = false;
    let warnNegativeMetric = false;
    let warnOvervalued = false;
    let warnDeterioration = false;
    let warnDebtHeavy = false;
    let warnMarginSqueeze = false;
    let warnRevDecline = false;
    let valWarnThreshold = 60;
    let fundScore = 0;
    let fundGrade = 'F';
    let fundGradeColor: 'green' | 'blue' | 'orange' | 'red' = 'red';
    let forecastValid = false;
    let priceBear: number | null = null;
    let priceFair: number | null = null;
    let priceBull: number | null = null;
    let upsideBear: number | null = null;
    let upsideFair: number | null = null;
    let upsideBull: number | null = null;
    let forecastBasisText = 'N/A';
    let sectorFitLabel = 'NO DATA';
    let sectorFitColor = 'gray';
    let cyclePhase = 'NO DATA';
    let nextPhase = 'NO DATA';
    let phaseLabel = 'NO DATA';
    let weeklyTrend = 'BEARISH';
    let rsVsBenchmark = 'NO DATA';
    let warnProb: number | null = null;
    let entryProb: number | null = null;
    let stopLevel: number | null = null;
    let rrRatio: number | null = null;
    let distToMA50Pct: number | null = null;
    let distToMA200Pct: number | null = null;
    let volStatus: 'STABLE' | 'ACCUMULATION' | 'DISTRIBUTION' = 'STABLE';

    if (fundamentals) {
      sector = fundamentals.sector;
      isBank = /financial|finance/i.test(sector ?? '');
      isUtility = /utilities|utility/i.test(sector ?? '');
      netIncome = fundamentals.netIncome;
      fcfEffective = fundamentals.fcf;
      eps = fundamentals.eps;
      curEquity = fundamentals.equity;
      revTTM = fundamentals.revenue;
      totalDebt = fundamentals.totalDebt;
      sharesOut = fundamentals.sharesOutstanding;
      if (sharesOut == null && netIncome != null && eps != null && eps !== 0) {
        sharesOut = Math.abs(netIncome / eps);
      }

      const fcfY = fundamentals.fcfHistory;
      const revY = fundamentals.revenueHistory;
      const eqY = fundamentals.equityHistory;
      const epsY = fundamentals.epsHistory;
      const niY = fundamentals.netIncomeHistory;

      const revG = growthCAGR(revY[0] ?? null, revY[1] ?? null, revY[2] ?? null, revY[3] ?? null, revY[4] ?? null);
      const fcfG = growthCAGR(fcfY[0] ?? null, fcfY[1] ?? null, fcfY[2] ?? null, fcfY[3] ?? null, fcfY[4] ?? null);
      const eqG = growthCAGR(eqY[0] ?? null, eqY[1] ?? null, eqY[2] ?? null, eqY[3] ?? null, eqY[4] ?? null);
      const epsG = growthCAGR(epsY[0] ?? null, epsY[1] ?? null, epsY[2] ?? null, epsY[3] ?? null, epsY[4] ?? null);
      revCAGR = revG.cagr;
      fcfCAGR = fcfG.cagr;
      eqCAGR = eqG.cagr;
      epsCAGR = epsG.cagr;
      revValid = revCAGR != null;
      fcfValid = fcfCAGR != null;
      eqValid = eqCAGR != null;
      epsValid = epsCAGR != null;

      const isNoProfit = (netIncome == null || netIncome <= 0) && (fcfEffective == null || fcfEffective <= 0);
      const isGrowthSpec = !isBank && !isUtility && isNoProfit;
      if (isBank) valuationModel = 'BOOK';
      else if (isUtility) valuationModel = 'EARNINGS';
      else if (isGrowthSpec) valuationModel = 'SALES';
      else valuationModel = 'FCF';

      if (isBank && eqValid && (eqCAGR ?? 0) < 0 && epsValid && (epsCAGR ?? 0) > 0 && (eps ?? 0) > 0) {
        valuationModel = 'EARNINGS';
      }

      const revDropY0Y1 = revY[1] != null && revY[1] > 0 && revY[0] != null ? (revY[0] / revY[1] - 1) * 100 : null;
      const revDropY1Y2 = revY[2] != null && revY[2] > 0 && revY[1] != null ? (revY[1] / revY[2] - 1) * 100 : null;
      isRestructured =
        revDropY0Y1 != null && revDropY1Y2 != null && revDropY0Y1 < -15 && revDropY1Y2 > -10;

      const getTrend = (cagr: number | null, period: string, th: number) => {
        if (cagr == null) return { str: 'NO DATA', col: 'gray' as const };
        if (cagr > th) return { str: `GROWING ${period} (+${cagr.toFixed(1)}%)`, col: 'green' as const };
        if (cagr < -th) return { str: `DECLINING ${period} (${cagr.toFixed(1)}%)`, col: 'red' as const };
        return { str: `STABLE ${period} (${cagr.toFixed(1)}%)`, col: 'blue' as const };
      };
      const revT = getTrend(revCAGR, revG.period, 5);
      revTrend = isRestructured ? 'RESTRUCTURED (use 1Y)' : revT.str;
      revColor = isRestructured ? 'orange' : revT.col;
      const fcfT = getTrend(fcfCAGR, fcfG.period, 5);
      fcfTrend = fcfT.str;
      fcfColor = fcfT.col;
      phaseLabel = fcfValid && fcfCAGR != null ? `CYCLICAL BOOM (FCF CAGR ${fcfCAGR.toFixed(1)}%)` : cyclePhase;

      const isGAAPProfit = nz(netIncome) > 0;
      const fcfY0 = fcfY[0];
      const isCashProfitable =
        !isGAAPProfit && (fcfY0 != null && fcfY0 > 0) && (eps != null && eps > 0);
      isProfitable = isGAAPProfit || isCashProfitable;
      if (isGAAPProfit) {
        profitLabel = `YES (${(netIncome! / 1e6).toFixed(1)}M)`;
        profitColor = 'green';
      } else if (isBank) {
        profitLabel = 'NO';
        profitColor = 'red';
      } else if (isCashProfitable) {
        profitLabel = `CASH PROF. (${(fcfY0! / 1e6).toFixed(1)}M FCF)`;
        profitColor = 'blue';
      } else {
        profitLabel = 'NO';
        profitColor = 'red';
      }
      epsDisplay = fundamentals.eps;

      const hasShares = sharesOut != null && sharesOut > 0;
      const fcfPS0 = hasShares && fcfEffective != null ? fcfEffective / sharesOut! : null;
      const eqPS0 = hasShares && curEquity != null ? curEquity / sharesOut! : null;
      const epsPS0 = eps;
      const revPS0 = hasShares && revTTM != null ? revTTM / sharesOut! : null;

      const currentPFCF = fcfPS0 != null && fcfPS0 > 0 ? close / fcfPS0 : null;
      const currentPB = eqPS0 != null && eqPS0 > 0 ? close / eqPS0 : null;
      const currentPE = epsPS0 != null && epsPS0 > 0 ? close / epsPS0 : null;
      const currentPS = revPS0 != null && revPS0 > 0 ? close / revPS0 : null;

      if (valuationModel === 'BOOK') {
        activeMetric = eqPS0 ?? 0;
        activeMultiple = currentPB;
        activeMetricName = 'P/B';
      } else if (valuationModel === 'EARNINGS') {
        activeMetric = epsPS0 ?? 0;
        activeMultiple = currentPE;
        activeMetricName = 'P/E';
      } else if (valuationModel === 'SALES') {
        activeMetric = revPS0 ?? 0;
        activeMultiple = currentPS;
        activeMetricName = 'P/S';
      } else {
        activeMetric = fcfPS0 ?? 0;
        activeMultiple = currentPFCF;
        activeMetricName = 'P/FCF';
      }

      const sharesOutPrev = niY[1] != null && epsY[1] != null && epsY[1] !== 0
        ? Math.abs(niY[1] / epsY[1])
        : null;
      const dilutionPct =
        sharesOut != null && sharesOutPrev != null && sharesOutPrev > 0
          ? (sharesOut / sharesOutPrev - 1) * 100
          : null;
      warnDilution = dilutionPct != null && dilutionPct > 5;
      warnNegativeMetric = activeMetric <= 0;

      if (valuationModel === 'BOOK') {
        warnDeterioration = eqValid && (eqCAGR ?? 0) < -5;
        valWarnThreshold = 3;
      } else if (valuationModel === 'EARNINGS') {
        warnDeterioration = epsValid && (epsCAGR ?? 0) < -2;
        valWarnThreshold = 25;
      } else if (valuationModel === 'SALES') {
        warnDeterioration = revValid && (revCAGR ?? 0) < 5;
        valWarnThreshold = 20;
      } else {
        isInvestmentPhase = revValid && fcfValid && (revCAGR ?? 0) > 5 && (fcfCAGR ?? 0) < -10;
        warnDeterioration = fcfValid && (fcfCAGR ?? 0) < -10 && !isInvestmentPhase;
        valWarnThreshold = 60;
      }
      warnOvervalued = activeMultiple != null && activeMultiple > valWarnThreshold;
      const debtToFCF =
        totalDebt != null && fcfEffective != null && fcfEffective > 0
          ? totalDebt / fcfEffective
          : null;
      warnDebtHeavy = !isBank && !isUtility && debtToFCF != null && debtToFCF > 10;

      const niGrowth =
        niY[0] != null && niY[1] != null && niY[1] > 0 && niY[0] > 0
          ? (niY[0] / niY[1] - 1) * 100
          : null;
      const revGrowth =
        revY[0] != null && revY[1] != null && revY[1] > 0 ? (revY[0] / revY[1] - 1) * 100 : null;
      warnMarginSqueeze =
        !isRestructured &&
        niGrowth != null &&
        revGrowth != null &&
        revGrowth > 0 &&
        niGrowth < revGrowth &&
        revGrowth - niGrowth > 5;
      warnRevDecline = !isRestructured && revValid && (revCAGR ?? 0) < -5;

      fundScore =
        (isProfitable ? 1 : 0) +
        (isBank ? (curEquity != null && curEquity > 0 ? 1 : 0) : (fcfEffective != null && fcfEffective > 0 ? 1 : 0)) +
        (isBank ? (eqValid && (eqCAGR ?? 0) > 5 ? 1 : 0) : (fcfValid && (fcfCAGR ?? 0) > 5 ? 1 : 0)) +
        (revValid && (revCAGR ?? 0) > 5 ? 1 : 0) +
        (eps != null && eps > 0 ? 1 : 0);
      fundGrade =
        fundScore >= 5 ? 'A+' : fundScore >= 4 ? 'A' : fundScore >= 3 ? 'B' : fundScore >= 2 ? 'C' : fundScore >= 1 ? 'D' : 'F';
      fundGradeColor =
        fundScore >= 4 ? 'green' : fundScore >= 3 ? 'blue' : fundScore >= 2 ? 'orange' : 'red';

      let smartGrowth = 0;
      let forecastAdjLabel = '';
      if (valuationModel === 'BOOK') {
        smartGrowth = eqValid ? (eqCAGR ?? 0) : 0;
        forecastAdjLabel = 'BOOK';
      } else if (valuationModel === 'EARNINGS') {
        smartGrowth = epsValid ? (isUtility ? Math.min(epsCAGR ?? 0, 10) : decayGrowth(epsCAGR ?? 0)) : 0;
        forecastAdjLabel = isUtility ? 'REGULATED' : 'EARNINGS';
      } else if (valuationModel === 'SALES') {
        smartGrowth = revValid ? decayGrowth(revCAGR ?? 0) : 0;
        forecastAdjLabel = 'REVENUE';
      } else {
        if (isRestructured) smartGrowth = 0;
        else if (isInvestmentPhase) {
          smartGrowth = Math.max(0, ((fcfCAGR ?? 0) + (revCAGR ?? 0)) / 2);
          forecastAdjLabel = 'INVEST ADJ';
        } else {
          smartGrowth = fcfValid ? decayGrowth(fcfCAGR ?? 0) : 0;
        }
      }
      const finalGrowthRate = Math.max(-0.4, Math.min(smartGrowth / 100, 0.4));
      forecastValid = activeMultiple != null && activeMetric > 0;

      let forecastMultiple = activeMultiple ?? 0;
      if (valuationModel === 'EARNINGS' && forecastMultiple > 20)
        forecastMultiple = (forecastMultiple + 15) / 2;
      else if (valuationModel === 'SALES' && forecastMultiple > 15)
        forecastMultiple = (forecastMultiple + 5) / 2;
      else if (valuationModel === 'BOOK' && forecastMultiple > 2)
        forecastMultiple = (forecastMultiple + 1) / 2;
      else if (forecastMultiple > 50)
        forecastMultiple = (forecastMultiple + 30) / 2;

      const metricPerShareFwd = forecastValid ? activeMetric * (1 + finalGrowthRate) : 0;
      priceBear = forecastValid ? metricPerShareFwd * forecastMultiple * 0.7 : null;
      priceFair = forecastValid ? metricPerShareFwd * forecastMultiple * 1 : null;
      priceBull = forecastValid ? metricPerShareFwd * forecastMultiple * 1.3 : null;
      if (close > 0) {
        upsideBear = priceBear != null ? (priceBear / close - 1) * 100 : null;
        upsideFair = priceFair != null ? (priceFair / close - 1) * 100 : null;
        upsideBull = priceBull != null ? (priceBull / close - 1) * 100 : null;
      }
      if (!forecastValid) forecastBasisText = `NO FORECAST (${activeMetricName} < 0)`;
      else {
        const growthLabel = (finalGrowthRate >= 0 ? '+' : '') + (finalGrowthRate * 100).toFixed(1) + '%';
        forecastBasisText = (forecastAdjLabel ? growthLabel + ' (' + forecastAdjLabel + ')' : growthLabel) + ' | NORM ' + forecastMultiple.toFixed(1) + 'x';
      }
    }

    const warnCount =
      (warnDilution ? 1 : 0) +
      (warnNegativeMetric ? 1 : 0) +
      (warnMarginSqueeze ? 1 : 0) +
      (warnRevDecline ? 1 : 0) +
      (warnDeterioration ? 1 : 0) +
      (warnOvervalued ? 1 : 0) +
      (warnDebtHeavy ? 1 : 0);
    let warnText = '';
    if (warnDilution) warnText += 'DILUTION ';
    if (warnNegativeMetric) warnText += activeMetricName + '<0 ';
    if (warnOvervalued) warnText += activeMetricName + '>' + valWarnThreshold + ' ';
    if (warnDeterioration) warnText += 'FUNDAMENTALS↓↓ ';
    if (warnDebtHeavy) warnText += 'DEBT ';
    if (warnCount === 0) warnText = 'ALL CLEAR ✓';

    const stopATR = atrVal != null ? close - atrVal * 2 : 0;
    const stopBase = lowestLowLast ?? 0;
    stopLevel = Math.max(stopATR, stopBase);
    const riskPerShare = close - stopLevel;
    const rewardPerShare = (highestHighLast ?? close) - close;
    rrRatio = riskPerShare > 0 ? rewardPerShare / riskPerShare : null;

    if (ma50 != null && ma50 > 0) distToMA50Pct = ((close - ma50) / ma50) * 100;
    if (ma200 != null && ma200 > 0) distToMA200Pct = ((close - ma200) / ma200) * 100;

    const maxVol5 = Math.max(...volumes.slice(-5));
    if (avgVol != null && maxVol5 > avgVol * VOL_THRESHOLD) {
      volStatus = close > (closes[last - 1] ?? 0) && close > (ma50 ?? 0) ? 'ACCUMULATION' : 'DISTRIBUTION';
    }
    const sma20Last = sma20Arr[last] ?? null;
    weeklyTrend = (sma20Last != null && close > sma20Last) ? 'BULLISH' : 'BEARISH';

    const prevC = closes[last - 1] ?? close;
    const logReturn = prevC > 0 && close > 0 ? Math.log(close / prevC) : 0;
    const probLookback = 20;
    let logStdDev = 0;
    for (let i = last - probLookback; i < last && i >= 0; i++) {
      const p = closes[i - 1], c = closes[i];
      if (p != null && c != null && p > 0 && c > 0)
        logStdDev += Math.pow(Math.log(c / p) - logReturn, 2);
    }
    logStdDev = Math.sqrt(logStdDev / Math.max(1, probLookback));
    const expectedMove = close * logStdDev * Math.sqrt(5);
    const distToMA50 = close - (ma50 ?? 0);
    warnProb = distToMA50 > 0 ? Math.min(100, (expectedMove / distToMA50) * 50) : 100;
    const distToHigh = (highestHighLast ?? close) - close;
    entryProb = distToHigh > 0 ? Math.min(100, (expectedMove / distToHigh) * 50) : 100;

    const highestHighShifted: (number | null)[] = highestHigh.map((_, idx) => (idx > 0 ? highestHigh[idx - 1] : null));

    let lastEntryBar: number | null = null;
    let lastWarningBar: number | null = null;
    const entryIndices: number[] = [];
    const warningIndices: number[] = [];

    for (let i = BASE_LOOKBACK; i < bars.length; i++) {
      const c = closes[i] ?? 0;
      const vol = volumes[i] ?? 0;
      const av = avgVolArr[i];
      const ma50i = sma50Arr[i];
      const ma200i = sma200Arr[i];
      const rsiI = rsiArr[i];
      const adxI = adxArr[i];
      const entryCooldownOk = lastEntryBar == null || i - lastEntryBar >= COOLDOWN_BARS;
      const warningCooldownOk = lastWarningBar == null || i - lastWarningBar >= COOLDOWN_BARS;

      const rawEntry =
        av != null &&
        ind.crossover(closes, highestHighShifted, i) &&
        vol > av * 1.2 &&
        c > (ma50i ?? 0) &&
        c > (ma200i ?? 0);
      const rawWarning = ind.crossunder(closes, sma50Arr, i) && av != null && vol > av * 1.1;
      const filteredEntry =
        rawEntry &&
        isProfitable &&
        (adxI != null && adxI > ADX_THRESHOLD) &&
        (rsiI == null || rsiI < RSI_OB);
      if (filteredEntry && entryCooldownOk) {
        lastEntryBar = i;
        entryIndices.push(i);
      }
      if (rawWarning && warningCooldownOk) {
        lastWarningBar = i;
        warningIndices.push(i);
      }
    }

    const sma50Series = times.map((t, i) => ({ time: t, value: sma50Arr[i] ?? 0 })).filter((_, i) => sma50Arr[i] != null);
    const sma200Series = times.map((t, i) => ({ time: t, value: sma200Arr[i] ?? 0 })).filter((_, i) => sma200Arr[i] != null);
    const bearSeries: { time: number; value: number }[] = [];
    const fairSeries: { time: number; value: number }[] = [];
    const bullSeries: { time: number; value: number }[] = [];
    if (priceBear != null && priceFair != null && priceBull != null) {
      times.forEach((t) => {
        bearSeries.push({ time: t, value: priceBear! });
        fairSeries.push({ time: t, value: priceFair! });
        bullSeries.push({ time: t, value: priceBull! });
      });
    }
    const stopSeries = times.map((t) => ({ time: t, value: stopLevel ?? 0 }));

    return {
      close,
      ma50,
      ma200,
      ma50Rising,
      rsi: rsiVal,
      adx: adxVal,
      isTrending: isTrending,
      avgVol,
      volStatus,
      stopLevel,
      rrRatio,
      distToMA50Pct,
      distToMA200Pct,
      valuationModel,
      activeMetricName,
      activeMultiple,
      warnCount,
      warnText,
      warnCountColor: warnCount === 0 ? 'green' : warnCount <= 2 ? 'orange' : 'red',
      fundScore,
      fundGrade,
      fundGradeColor,
      isProfitable,
      profitLabel,
      profitColor,
      eps: epsDisplay,
      revTrend,
      revColor,
      fcfTrend,
      fcfColor,
      forecastValid,
      priceBear,
      priceFair,
      priceBull,
      upsideBear,
      upsideFair,
      upsideBull,
      forecastBasisText,
      sma50Series,
      sma200Series,
      bearSeries,
      fairSeries,
      bullSeries,
      stopSeries,
      entryIndices: entryIndices.map((i) => times[i]!),
      warningIndices: warningIndices.map((i) => times[i]!),
      sector,
      sectorFitLabel,
      sectorFitColor,
      cyclePhase,
      nextPhase,
      phaseLabel,
      weeklyTrend,
      rsVsBenchmark,
      warnProb,
      entryProb,
    };
  }
}
