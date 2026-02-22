import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Bar } from '../models/data';
import { Fundamentals } from '../models/data';
import { toTicker } from '../core/ticker.util';

/**
 * Calls the local Yahoo backend (run `npm run server` in angular-app/server).
 * All data from Yahoo — no Alpha Vantage or FMP keys needed.
 */
@Injectable({ providedIn: 'root' })
export class YahooApiService {
  private readonly base = '/api';

  constructor(private http: HttpClient) {}

  getCandles(symbol: string, from: number, to: number): Observable<Bar[]> {
    const ticker = toTicker(symbol);
    const url = `${this.base}/candles?symbol=${encodeURIComponent(ticker)}&from=${from}&to=${to}`;
    return this.http.get<Bar[]>(url).pipe(
      map((bars) => bars ?? []),
      catchError((err) => {
        console.warn('Yahoo API candles failed (is server running?).', err);
        return of([]);
      })
    );
  }

  getFundamentals(symbol: string): Observable<Fundamentals | null> {
    const ticker = toTicker(symbol);
    const url = `${this.base}/fundamentals?symbol=${encodeURIComponent(ticker)}`;
    return this.http.get<Fundamentals>(url).pipe(
      map((f) => f ?? null),
      catchError(() => of(null))
    );
  }
}
