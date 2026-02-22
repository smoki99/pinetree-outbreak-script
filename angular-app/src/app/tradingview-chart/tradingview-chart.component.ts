import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  afterNextRender,
} from '@angular/core';

const WIDGET_SCRIPT_URL = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

@Component({
  selector: 'app-tradingview-chart',
  standalone: true,
  template: `<div #chartContainer class="tradingview-chart-container"></div>`,
  styles: [`
    .tradingview-chart-container {
      width: 100%;
      height: 100%;
      min-height: 500px;
    }
    .tradingview-chart-container :host ::ng-deep .tradingview-widget-container {
      height: 100%;
    }
    .tradingview-chart-container :host ::ng-deep .tradingview-widget-container__widget {
      height: 100%;
    }
  `],
})
export class TradingviewChartComponent implements OnChanges, OnDestroy {
  @Input() symbol = 'NASDAQ:AAPL';
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef<HTMLDivElement>;

  constructor() {
    afterNextRender(() => this.render());
  }

  private getConfig(): string {
    const config = {
      autosize: true,
      symbol: this.symbol,
      interval: 'D',
      timezone: 'exchange',
      theme: 'dark' as const,
      style: '1' as const,
      locale: 'en',
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    };
    return JSON.stringify(config);
  }

  private render(): void {
    const el = this.chartContainer?.nativeElement;
    if (!el) return;

    el.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'tradingview-widget-container';
    wrap.style.height = '100%';
    wrap.style.width = '100%';

    const inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    inner.style.height = 'calc(100% - 32px)';
    inner.style.width = '100%';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = WIDGET_SCRIPT_URL;
    script.async = true;
    script.textContent = this.getConfig();

    wrap.appendChild(inner);
    wrap.appendChild(script);
    el.appendChild(wrap);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['symbol'] && !changes['symbol'].firstChange) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    const el = this.chartContainer?.nativeElement;
    if (el) el.innerHTML = '';
  }
}
