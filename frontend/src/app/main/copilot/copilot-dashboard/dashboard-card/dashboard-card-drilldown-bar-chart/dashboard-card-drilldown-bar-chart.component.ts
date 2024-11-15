import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import Highcharts from 'highcharts/es-modules/masters/highcharts.src';
import 'highcharts/es-modules/masters/modules/drilldown.src';
import { HighchartsChartModule } from 'highcharts-angular';
import { CommonModule } from '@angular/common';
import { HighchartsService } from '../../../../../services/highcharts.service';
import { CopilotMetrics } from '../../../../../services/metrics.service.interfaces';
import { LoadingSpinnerComponent } from '../../../../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-dashboard-card-drilldown-bar-chart',
  standalone: true,
  imports: [
    MatCardModule,
    CommonModule,
    HighchartsChartModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './dashboard-card-drilldown-bar-chart.component.html',
  styleUrls: [
    './dashboard-card-drilldown-bar-chart.component.scss',
    '../dashboard-card.scss'
  ]
})
export class DashboardCardDrilldownBarChartComponent implements OnChanges {
  @Input() title?: string;
  Highcharts: typeof Highcharts = Highcharts;
  @Input() data?: CopilotMetrics[] = [];
  chartOptions: Highcharts.Options = {
    chart: {
      type: 'column'
    },
    xAxis: {
      type: 'category',
    },
    tooltip: {
        headerFormat: '<span>{series.name}</span><br>',
        pointFormat: '<span style="color:{point.color}">{point.name}</span>: ' +
            '<b>{point.y}</b> users<br/>'
    },
    legend: {
      enabled: false
    },
    series: [{
      type: 'column',
    }],
    drilldown: {
      series: [{        
        type: 'column'
      }]
    }
  };
  _chartOptions?: Highcharts.Options;
  updateFlag = false;

  constructor(
    private highchartsService: HighchartsService
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data) {
      this._chartOptions = this.highchartsService.transformCopilotMetricsToBarChartDrilldown(this.data);
      this.chartOptions = {
        ...this.chartOptions,
        ...this._chartOptions
      };
      this.updateFlag = true;
    }
  }
}
