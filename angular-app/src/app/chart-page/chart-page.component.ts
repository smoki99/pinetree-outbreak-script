import { Component, signal, computed, effect } from '@angular/core';
import { forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { StrategyChartComponent } from '../chart/strategy-chart.component';
import { StrategyDashboardComponent } from '../dashboard/strategy-dashboard.component';
import { YahooApiService } from '../data/yahoo-api.service';
import { StrategyService } from '../strategy/strategy.service';
import { SYMBOLS, DEFAULT_SYMBOL } from '../symbols';
import { Bar } from '../models/data';
import { Fundamentals } from '../models/data';
import { StrategyResult } from '../strategy/strategy.model';
import { toTicker } from '../core/ticker.util';

@Component({
  selector: 'app-chart-page',
  standalone: true,
  imports: [StrategyChartComponent, StrategyDashboardComponent],
  templateUrl: './chart-page.component.html',
  styleUrls: ['./chart-page.component.scss'],
})
export class ChartPageComponent {
  readonly symbols = SYMBOLS;
  readonly selectedSymbol = signal(DEFAULT_SYMBOL);
  readonly search = signal('');
  readonly openDropdown = signal(false);
  readonly bars = signal<Bar[]>([]);
  readonly result = signal<StrategyResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly filteredSymbols = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.symbols;
    return this.symbols.filter(
      (s) =>
        s.value.toLowerCase().includes(q) || s.label.toLowerCase().includes(q)
    );
  });

  readonly displayValue = computed(() => {
    const sym = this.selectedSymbol();
    const found = this.symbols.find((s) => s.value === sym);
    return found ? found.label : sym;
  });

  readonly tradingViewChartUrl = computed(() => {
    const sym = encodeURIComponent(this.selectedSymbol());
    return `https://www.tradingview.com/chart/?symbol=${sym}`;
  });

  constructor(
    private yahooApi: YahooApiService,
    private strategy: StrategyService
  ) {
    effect(
      () => {
        const sym = this.selectedSymbol();
        this.loadData(sym);
      },
      { allowSignalWrites: true }
    );
  }

  private loadData(symbol: string): void {
    this.loading.set(true);
    this.error.set(null);
    const ticker = toTicker(symbol);
    const to = Math.floor(Date.now() / 1000);
    const from = to - 365 * 24 * 60 * 60;

    const candles$ = this.yahooApi.getCandles(symbol, from, to).pipe(
      catchError((err) => {
        const msg = err?.message ?? '';
        // Don't show server internals (e.g. "Could not extract crumb from Yahoo") in the UI
        const friendly = msg && !/crumb|quoteSummary|yahoo/i.test(msg)
          ? msg
          : 'Failed to load price data. Run the Yahoo server: cd server && npm start';
        this.error.set(friendly);
        return of([] as Bar[]);
      })
    );
    const fundamentals$ = this.yahooApi.getFundamentals(symbol).pipe(
      catchError(() => of(null as Fundamentals | null)),
      map((f) => f ?? null)
    );

    forkJoin({ bars: candles$, fundamentals: fundamentals$ }).subscribe({
      next: ({ bars: b, fundamentals: f }) => {
        this.loading.set(false);
        if (!b.length) {
          this.bars.set([]);
          this.result.set(null);
          if (!this.error()) this.error.set('No price data. Check symbol and that the server is running (cd server && npm start).');
          return;
        }
        this.bars.set(b);
        const result = this.strategy.run(b, f);
        this.result.set(result);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.message ?? '';
        const friendly = msg && !/crumb|quoteSummary|yahoo/i.test(msg)
          ? msg
          : 'Failed to load data. Run the Yahoo server: cd server && npm start';
        this.error.set(friendly);
        this.bars.set([]);
        this.result.set(null);
      },
    });
  }

  onSelect(symbol: string): void {
    this.selectedSymbol.set(symbol);
    this.search.set('');
    this.openDropdown.set(false);
  }

  onInput(value: string): void {
    this.search.set(value);
    this.openDropdown.set(true);
    const byValue = this.symbols.find((s) => s.value === value);
    if (byValue) this.selectedSymbol.set(value);
    else if (this.isValidSymbol(value)) this.selectedSymbol.set(value);
  }

  private isValidSymbol(s: string): boolean {
    return /^[A-Z]+:[A-Z0-9.]+$/i.test(s.trim());
  }

  onBlur(): void {
    setTimeout(() => this.openDropdown.set(false), 150);
  }

  onFocus(): void {
    this.search.set(this.selectedSymbol());
    this.openDropdown.set(true);
  }
}
