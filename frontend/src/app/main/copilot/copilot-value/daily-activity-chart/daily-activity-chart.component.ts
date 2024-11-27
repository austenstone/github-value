import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { ActivityResponse } from '../../../../services/api/seat.service';
import { CopilotMetrics } from '../../../../services/api/metrics.service.interfaces';
import { HighchartsService } from '../../../../services/highcharts.service';

@Component({
  selector: 'app-daily-activity-chart',
  standalone: true,
  imports: [
    HighchartsChartModule
  ],
  templateUrl: './daily-activity-chart.component.html',
  styleUrl: './daily-activity-chart.component.scss'
})
export class DailyActivityChartComponent implements OnInit, OnChanges {
  Highcharts: typeof Highcharts = Highcharts;
  updateFlag = false;
  @Input() activity?: ActivityResponse;
  @Input() metrics?: CopilotMetrics[];
  @Input() chartOptions?: Highcharts.Options;
  @Output() chartInstanceChange = new EventEmitter<Highcharts.Chart>();
  _chartOptions: Highcharts.Options = {
    yAxis: {
      title: {
        text: 'Average Activity Per User'
      },
      min: 0,
      plotBands: [{
        from: 500,
        to: 750,
        color: 'var(--sys-surface-variant)',
        label: {
          text: 'Typical Range',
          style: {
            color: 'var(--sys-on-surface-variant)'
          }
        }
      }],
      plotLines: [{
        value: 1000,
        color: 'var(--sys-primary)',
        dashStyle: 'Dash',
        width: 2,
        label: {
          text: 'Target Level',
          align: 'left',
          style: {
            color: 'var(--sys-primary)'
          }
        },
        zIndex: 2
      }]
    },
    tooltip: {
      headerFormat: '<b>{point.x:%b %d, %Y}</b><br/>',
      pointFormatter: function () {
        return [
          `${this.series.name}: `,
          '<b>' + Math.round(this.y || 0) + '</b>'
        ].join('');
      },
      style: {
        fontSize: '14px'
      }
    },
    series: [{
      name: 'IDE Completions',
      type: 'spline',
    }, {
      name: 'IDE Chats',
      type: 'spline',
    }, {
      name: '.COM Chats',
      type: 'spline',
    }, {
      name: '.COM Pull Requests',
      type: 'spline',
    }]
  };

  constructor(
    private highchartsService: HighchartsService
  ) { }

  ngOnInit() {
    this._chartOptions.yAxis = Object.assign({}, this.chartOptions?.yAxis, this._chartOptions.yAxis);
    this._chartOptions.tooltip = Object.assign({}, this.chartOptions?.tooltip, this._chartOptions.tooltip);
    this._chartOptions = Object.assign({}, this.chartOptions, this._chartOptions);
  }
  
  ngOnChanges() {
    if (this.activity && this.metrics) {
      this._chartOptions = {
        ...this._chartOptions,
        ...this.highchartsService.transformMetricsToDailyActivityLine(this.activity, this.metrics)
      };
      this.updateFlag = true;
    }
  }
}
