import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import { CopilotMetrics } from '../../../../../services/api/metrics.service.interfaces';
import { HighchartsService } from '../../../../../services/highcharts.service';

@Component({
  selector: 'app-dashboard-card-line-chart',
  standalone: true,
  imports: [CommonModule, HighchartsChartModule],
  templateUrl: './dashboard-card-line-chart.component.html',
  styleUrls: ['./dashboard-card-line-chart.component.scss']
})
export class DashboardCardLineChartComponent implements OnChanges {
  @Input() data?: CopilotMetrics[];

  Highcharts: typeof Highcharts = Highcharts;
  options: Highcharts.Options | undefined;

  constructor(private highchartsService: HighchartsService) {}

  ngOnChanges(): void {
    if (this.data && this.data.length) {
      this.options = this.highchartsService.getLanguageTrendsChart(this.data);
    }
  }
}
