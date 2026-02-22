import { Bar } from '../models/data';

export function sma(closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) sum += closes[i - j]!;
    out.push(sum / period);
  }
  return out;
}

export function rsi(closes: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      out.push(null);
      continue;
    }
    let gains = 0, losses = 0;
    for (let j = 1; j <= period; j++) {
      const ch = (closes[i - j + 1] ?? 0) - (closes[i - j] ?? 0);
      if (ch > 0) gains += ch; else losses -= ch;
    }
    const avgGain = gains / period, avgLoss = losses / period;
    if (avgLoss === 0) {
      out.push(100);
      continue;
    }
    const rs = avgGain / avgLoss;
    out.push(100 - 100 / (1 + rs));
  }
  return out;
}

function trueRange(high: number[], low: number[], close: number[], i: number): number {
  if (i === 0) return high[i]! - low[i]!;
  const prevC = close[i - 1]!;
  return Math.max(high[i]! - low[i]!, Math.abs(high[i]! - prevC), Math.abs(low[i]! - prevC));
}

export function atr(high: number[], low: number[], close: number[], period: number): (number | null)[] {
  const tr: number[] = [];
  for (let i = 0; i < high.length; i++) tr.push(trueRange(high, low, close, i));
  return rma(tr, period);
}

function rma(arr: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    if (i < period) {
      sum += arr[i]!;
      out.push(i === period - 1 ? sum / period : null);
    } else {
      sum = (out[i - 1]! * (period - 1) + arr[i]!) / period;
      out.push(sum);
    }
  }
  return out;
}

export function adx(high: number[], low: number[], close: number[], period: number): (number | null)[] {
  const len = high.length;
  const dmPlus: number[] = [];
  const dmMinus: number[] = [];
  for (let i = 0; i < len; i++) {
    if (i === 0) {
      dmPlus.push(0);
      dmMinus.push(0);
    } else {
      const up = high[i]! - high[i - 1]!;
      const down = low[i - 1]! - low[i]!;
      dmPlus.push(up > down && up > 0 ? up : 0);
      dmMinus.push(down > up && down > 0 ? down : 0);
    }
  }
  const tr: number[] = [];
  for (let i = 0; i < len; i++) tr.push(trueRange(high, low, close, i));
  const smTR = rma(tr, period);
  const smPlus = rma(dmPlus, period);
  const smMinus = rma(dmMinus, period);
  const out: (number | null)[] = [];
  const diPlus: (number | null)[] = [];
  const diMinus: (number | null)[] = [];
  for (let i = 0; i < len; i++) {
    const trVal = smTR[i];
    if (trVal == null || trVal === 0) {
      diPlus.push(null);
      diMinus.push(null);
      out.push(null);
      continue;
    }
    const plus = ((smPlus[i] ?? 0) / trVal) * 100;
    const minus = ((smMinus[i] ?? 0) / trVal) * 100;
    diPlus.push(plus);
    diMinus.push(minus);
    const sum = plus + minus;
    const dx = sum > 0 ? (Math.abs(plus - minus) / sum) * 100 : 0;
    out.push(dx);
  }
  return rma(out.map((v) => v ?? 0), period);
}

export function highest(arr: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    let h = arr[i]!;
    for (let j = 1; j < period; j++) h = Math.max(h, arr[i - j]!);
    out.push(h);
  }
  return out;
}

export function lowest(arr: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    let l = arr[i]!;
    for (let j = 1; j < period; j++) l = Math.min(l, arr[i - j]!);
    out.push(l);
  }
  return out;
}

export function crossover(a: (number | null)[], b: (number | null)[], i: number): boolean {
  if (i < 1) return false;
  const a0 = a[i] ?? 0, a1 = a[i - 1] ?? 0;
  const b0 = b[i] ?? 0, b1 = b[i - 1] ?? 0;
  return a1 <= b1 && a0 > b0;
}

export function crossunder(a: (number | null)[], b: (number | null)[], i: number): boolean {
  if (i < 1) return false;
  const a0 = a[i] ?? 0, a1 = a[i - 1] ?? 0;
  const b0 = b[i] ?? 0, b1 = b[i - 1] ?? 0;
  return a1 >= b1 && a0 < b0;
}
