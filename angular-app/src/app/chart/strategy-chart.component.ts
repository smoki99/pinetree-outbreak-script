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
import { Bar } from '../models/data';
import { StrategyResult } from '../strategy/strategy.model';
import ApexCharts from 'apexcharts';

/** Unix second → ms for ApexCharts datetime x-axis */
function timeMs(t: number): number {
  return t * 1000;
}

@Component({
  selector: 'app-strategy-chart',
  standalone: true,
  template: `<div #chartEl class="strategy-chart"></div>`,
  styles: [`
    .strategy-chart {
      width: 100%;
      min-width: 300px;
      height: 420px;
      min-height: 400px;
    }
  `],
})
export class StrategyChartComponent implements OnChanges, OnDestroy {
  @Input() bars: Bar[] = [];
  @Input() result: StrategyResult | null = null;
  @ViewChild('chartEl', { static: true }) chartEl!: ElementRef<HTMLDivElement>;

  private chart: ApexCharts | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    afterNextRender(() => this.scheduleInit());
  }

  private scheduleInit(): void {
    if (this.chart || !this.chartEl?.nativeElement) return;
    if (this.bars.length) {
      this.createChart();
      return;
    }
    // No data yet; ngOnChanges will call createChart when bars arrive
  }

  private createChart(): void {
    const el = this.chartEl?.nativeElement;
    if (!el || this.chart || !this.bars.length) return;
    // Defer so the container has layout (width/height) before ApexCharts measures it
    const run = () => {
      if (this.chart) return;
      try {
        this.chart = new ApexCharts(el, this.buildOptions());
        this.chart.render();
        this.resizeObserver = new ResizeObserver(() => (this.chart as unknown as { resize?: () => void })?.resize?.());
        this.resizeObserver.observe(el);
      } catch (err) {
        console.error('Strategy chart init failed', err);
      }
    };
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => run());
    } else {
      setTimeout(run, 50);
    }
  }

  private buildOptions(): ApexCharts.ApexOptions {
    const candleData = this.bars.map((b) => ({
      x: timeMs(b.time),
      y: [b.open, b.high, b.low, b.close],
    }));
    const volumeData = this.bars.map((b) => ({
      x: timeMs(b.time),
      y: b.volume,
      fillColor: b.close >= b.open ? '#3fb950' : '#f85149',
    }));

    // Price and all overlay lines first (left y-axis); Volume last with seriesName so it uses right y-axis only.
    const series: ApexCharts.ApexOptions['series'] = [
      { name: 'Price', type: 'candlestick', data: candleData },
    ];
    const r = this.result;
    if (r?.sma50Series?.length) {
      series.push({ name: 'SMA 50', type: 'line', data: r.sma50Series.map((d) => ({ x: timeMs(d.time), y: d.value })) });
    }
    if (r?.sma200Series?.length) {
      series.push({ name: 'SMA 200', type: 'line', data: r.sma200Series.map((d) => ({ x: timeMs(d.time), y: d.value })) });
    }
    if (r?.stopSeries?.length) {
      series.push({ name: 'Stop', type: 'line', data: r.stopSeries.map((d) => ({ x: timeMs(d.time), y: d.value })) });
    }
    if (r?.bullSeries?.length) {
      series.push({ name: 'Bull (1Y)', type: 'line', data: r.bullSeries.map((d) => ({ x: timeMs(d.time), y: d.value })) });
    }
    if (r?.fairSeries?.length) {
      series.push({ name: 'Fair (1Y)', type: 'line', data: r.fairSeries.map((d) => ({ x: timeMs(d.time), y: d.value })) });
    }
    if (r?.bearSeries?.length) {
      series.push({ name: 'Bear (1Y)', type: 'line', data: r.bearSeries.map((d) => ({ x: timeMs(d.time), y: d.value })) });
    }
    series.push({ name: 'Volume', type: 'bar', data: volumeData });

    // Explicit seriesName per y-axis so ApexCharts builds seriesYAxisMap correctly (avoids undefined.push in Scales).
    const priceSeriesNames = series.filter((s) => s.name !== 'Volume').map((s) => s.name!);

    // WARNING / ENTRY markers: find bar high at each timestamp for label placement
    const timeToBar = new Map(this.bars.map((b) => [b.time, b]));
    const points: NonNullable<NonNullable<ApexCharts.ApexOptions['annotations']>['points']> = [];
    (r?.warningIndices ?? []).forEach((t) => {
      const bar = timeToBar.get(t);
      const y = bar ? bar.high : undefined;
      if (y != null) {
        points.push({
          x: timeMs(t),
          y,
          marker: { size: 0 },
          label: {
            borderColor: '#f85149',
            borderWidth: 1,
            borderRadius: 2,
            text: 'WARNING',
            textAnchor: 'middle',
            offsetY: -4,
            style: { background: '#f85149', color: '#fff', fontSize: '10px', padding: { left: 6, right: 6 } },
          },
        });
      }
    });
    (r?.entryIndices ?? []).forEach((t) => {
      const bar = timeToBar.get(t);
      const y = bar ? bar.low : undefined;
      if (y != null) {
        points.push({
          x: timeMs(t),
          y,
          marker: { size: 0 },
          label: {
            borderColor: '#3fb950',
            borderWidth: 1,
            borderRadius: 2,
            text: 'ENTRY',
            textAnchor: 'middle',
            offsetY: 4,
            style: { background: '#3fb950', color: '#fff', fontSize: '10px', padding: { left: 6, right: 6 } },
          },
        });
      }
    });

    return {
      chart: {
        type: 'candlestick',
        height: 420,
        background: '#161b22',
        toolbar: { show: true },
        zoom: { enabled: true },
        animations: { enabled: true },
      },
      series,
      stroke: { width: 2 },
      colors: ['#58a6ff', '#e6edf3', 'rgba(248,81,73,0.8)', '#d29922', '#3fb950', '#f85149'],
      plotOptions: {
        candlestick: {
          colors: { upward: '#3fb950', downward: '#f85149' },
        },
        bar: {
          columnWidth: '60%',
          distributed: false,
        },
      },
      fill: {
        colors: (() => {
          const volIdx = series.length - 1;
          const fillColors: (string | ((opts: { seriesIndex: number; dataPointIndex: number; w: { config: ApexCharts.ApexOptions } }) => string | undefined))[] = new Array(series.length);
          fillColors[volIdx] = ({ dataPointIndex, w }) => {
            const candle = (w.config.series?.[0] as { data?: Array<{ y?: number[] }> })?.data?.[dataPointIndex];
            if (!candle?.y || !Array.isArray(candle.y) || candle.y.length < 4) return '#8b949e';
            const open = candle.y[0];
            const close = candle.y[3];
            return close >= open ? '#3fb950' : '#f85149';
          };
          return fillColors;
        })(),
      },
      xaxis: {
        type: 'datetime',
        labels: { style: { colors: '#8b949e' } },
        axisBorder: { show: true, color: '#30363d' },
      },
      yaxis: [
        { seriesName: priceSeriesNames, title: { text: 'Price', style: { color: '#8b949e' } }, labels: { style: { colors: '#8b949e' }, formatter: (val: number) => Number(val).toFixed(2) }, tooltip: { enabled: false }, axisBorder: { show: true, color: '#30363d' } },
        { opposite: true, seriesName: 'Volume', title: { text: 'Volume', style: { color: '#8b949e' } }, labels: { style: { colors: '#8b949e' }, formatter: (val: number) => Number(val).toFixed(2) }, tooltip: { enabled: false }, axisBorder: { show: true, color: '#30363d' }, min: 0 },
      ],
      annotations: points.length ? { points } : undefined,
      grid: {
        borderColor: '#21262d',
        strokeDashArray: 0,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } },
      },
      legend: {
        labels: { colors: '#8b949e' },
        position: 'top',
        horizontalAlign: 'right',
      },
      tooltip: {
        theme: 'dark',
        x: { format: 'yyyy-MM-dd' },
        y: { formatter: (val: number) => (val != null && !Number.isNaN(val) ? Number(val).toFixed(2) : '') },
      },
    };
  }

  private updateData(): void {
    if (!this.chart) return;
    const opts = this.buildOptions();
    this.chart.updateOptions(opts, true, false);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!(changes['bars'] || changes['result'])) return;
    if (this.chart) {
      this.updateData();
    } else if (this.bars.length && this.chartEl?.nativeElement) {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.chart?.destroy();
    this.chart = null;
  }
}
