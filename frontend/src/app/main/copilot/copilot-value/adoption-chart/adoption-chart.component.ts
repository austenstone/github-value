import { Component, Input, SimpleChanges } from '@angular/core';
import Highcharts from 'highcharts/es-modules/masters/highcharts.src';
import { HighchartsChartModule } from 'highcharts-angular';
import { ActivityResponse } from '../../../../services/seat.service';
import { HighchartsService } from '../../../../services/highcharts.service';

@Component({
  selector: 'app-adoption-chart',
  standalone: true,
  imports: [
    HighchartsChartModule
  ],
  templateUrl: './adoption-chart.component.html',
  styleUrl: './adoption-chart.component.scss'
})
export class AdoptionChartComponent {
  Highcharts: typeof Highcharts = Highcharts;
  updateFlag = false;
  totalUsers = 500;
  @Input() data?: ActivityResponse;
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
        text: 'Adoption (%)'
      },
      min: 0,
      max: 100,
      labels: {
        format: '{value}%'
      },
      plotBands: [{
        from: 40,
        to: 60,
        color: 'var(--sys-surface-variant)',
        label: {
          text: 'Typical Range',
          style: {
            color: 'var(--sys-on-surface-variant)'
          }
        }
      }],
      plotLines: [{
        value: 75,
        color: 'var(--sys-primary)',
        dashStyle: 'Dash',
        width: 2,
        label: {
          text: 'Target Level',
          align: 'left',
          style: {
            color: 'var(--sys-primary)'
          }
        }
      }]
    },
    tooltip: {
      headerFormat: '<b>{point.x:%b %d, %Y}</b><br/>',
      pointFormat: [
        '{series.name}: ',
        '<b>{point.raw}</b>',
        '(<b>{point.y:.1f}%</b>)'
      ].join(''),
      style: {
        fontSize: '14px'
      }
    },
    series: [{
      name: 'Users',
      type: 'spline',
      data: [],
      lineWidth: 2,
      marker: {
        enabled: true,
        radius: 4,
        symbol: 'circle'
      },
      states: {
        hover: {
          lineWidth: 3
        }
      }
    }],
    legend: {
      enabled: false
    },
    plotOptions: {
      series: {
        animation: {
          duration: 300
        }
      }
    }
  };
  _chartOptions?: any; // Highcharts.Options;


  constructor(
    private highchartsService: HighchartsService
  ) {
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('old', this.chartOptions);
    if (changes['data'] && this.data) {
      this._chartOptions = this.highchartsService.transformActivityMetricsToLine(this.data);
      this.chartOptions = {
        ...this.chartOptions,
        ...this._chartOptions
      };
      console.log('new', this.chartOptions);
      this.updateFlag = true;
    }
  }
}
