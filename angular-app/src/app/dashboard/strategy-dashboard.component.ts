import { Component, Input } from '@angular/core';
import { StrategyResult } from '../strategy/strategy.model';

@Component({
  selector: 'app-strategy-dashboard',
  standalone: true,
  templateUrl: './strategy-dashboard.component.html',
  styleUrls: ['./strategy-dashboard.component.scss'],
})
export class StrategyDashboardComponent {
  @Input() result: StrategyResult | null = null;
}
