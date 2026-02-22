import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./chart-page/chart-page.component').then(m => m.ChartPageComponent) },
  { path: '**', redirectTo: '' },
];
