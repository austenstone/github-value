import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CopilotMetrics } from '../../../../../services/api/metrics.service.interfaces';
import { HighchartsService } from '../../../../../services/highcharts.service';
import { LoadingSpinnerComponent } from '../../../../../shared/loading-spinner/loading-spinner.component';

export interface DashboardCardBarsInput {
  value: number;
  maxValue: number;
  icon: string;
  name: string;
  percentage?: number;
};

@Component({
  selector: 'app-dashboard-card-bars',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    CommonModule,
    MatProgressBarModule,
    MatIconModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './dashboard-card-bars.component.html',
  styleUrls: [
    './dashboard-card-bars.component.scss',
    '../dashboard-card.scss'
  ]
})
export class DashboardCardBarsComponent implements OnChanges {
  @Input() data?: CopilotMetrics;
  @Input() totalSeats?: number;
  sections?: DashboardCardBarsInput[];
  percentages: number[] = []
  Math = Math;

  constructor(
    private highchartsService: HighchartsService
  ) {}

  ngOnChanges() {
    if (this.data && this.totalSeats) {
      this.sections = this.highchartsService.transformCopilotMetricsToBars(this.data, this.totalSeats);
      if (this.sections) {
        this.sections.forEach((row) => {
          row.percentage = (row.value / (row.maxValue || 100)) * 100;
        })
      }
    }
  }
  
}
