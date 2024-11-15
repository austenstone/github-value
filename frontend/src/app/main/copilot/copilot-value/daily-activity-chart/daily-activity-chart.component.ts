import { Component, Input, OnChanges } from '@angular/core';
import Highcharts from 'highcharts/es-modules/masters/highcharts.src';
import { HighchartsChartModule } from 'highcharts-angular';
import { ActivityResponse } from '../../../../services/seat.service';
import { CopilotMetrics } from '../../../../services/metrics.service.interfaces';
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
export class DailyActivityChartComponent implements OnChanges {
  Highcharts: typeof Highcharts = Highcharts;
  updateFlag = false;
  totalUsers = 500;
  @Input() activity?: ActivityResponse;
  @Input() metrics?: CopilotMetrics[];

  chartOptions: Highcharts.Options = {
    chart: {
      zooming: {
        type: 'x'
      },
      width: undefined,
    },
    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: {
        // don't display the year
        month: '%b',
        year: '%b'
      },
      crosshair: true
    },
    yAxis: {
      title: {
        text: 'Average Activity Per User'
      },
      min: 0,
      // max: 100,
      // labels: {
      //   format: '{value}%'
      // },
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
    }],
    // legend: {
    //   enabled: false
    // },
    plotOptions: {
      series: {
        animation: {
          duration: 300
        }
      }
    }
  };
  _chartOptions?: Highcharts.Options;

  constructor(
    private highchartsService: HighchartsService
  ) {
  }

  ngOnChanges() {
    console.log('old', this.chartOptions);
    if (this.activity && this.metrics) {
      this._chartOptions = this.highchartsService.transformMetricsToDailyActivityLine(this.activity, this.metrics);
      this.chartOptions = {
        ...this.chartOptions,
        ...this._chartOptions
      };
      console.log('new', this.chartOptions);
      this.updateFlag = true;
    }
  }
}
