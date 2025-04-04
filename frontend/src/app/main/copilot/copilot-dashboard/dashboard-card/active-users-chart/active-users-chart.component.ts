import { Component, Input, OnChanges } from '@angular/core';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import { Router } from '@angular/router';

@Component({
  selector: 'app-active-users-chart',
  standalone: true,
  imports: [HighchartsChartModule],
  template: `<highcharts-chart 
    [Highcharts]="Highcharts"
    [options]="_chartOptions"
    [(update)]="updateFlag"
    style="width: 200px; height: 200px;">
  </highcharts-chart>`
})
export class ActiveUsersChartComponent implements OnChanges {
  @Input() data?: {
    login: string,
    total_time: number,
    avatar_url: string,
  }[];
  @Input() chartOptions?: Highcharts.Options;
  Highcharts: typeof Highcharts = Highcharts;
  updateFlag = false;
  _chartOptions: Highcharts.Options = {
    chart: {
      type: 'bar'
    },
    title: { text: undefined },
    legend: { enabled: false },
    xAxis: {
      crosshair: false,
      visible: false,
    },
    series: [{
      name: 'Activity',
      type: 'bar',
      data: [], // Will be updated in ngOnChanges
      colorByPoint: true,
      borderWidth: 0,
      // Use point.options to access custom properties
      keys: ['y', 'login', 'avatar_url']
    }],
    tooltip: {
      pointFormat: '<span style="padding:0">{point.y: .1f} hours</span>',
      headerFormat: '',
      formatter: function () {
        const hours = (this.y || 0); // Convert ms to hours
        // Access login from the keys mapping
        const login = (this.point as any).login || this.key;
        return `<span style="padding:0">@${login}</span><br>
        <span style="padding:0">${hours.toFixed(1)} hours</span>`;
      },
      outside: true,
      distance: 30
    },
    plotOptions: {
      bar: {
        dataLabels: [{
          enabled: true,
          formatter: function () {
            // Access avatar_url from the keys mapping
            const avatar_url = (this.point as any).avatar_url || `https://github.com/${this.key}.png`;
            return `<div style="width: 20px; height: 20px; overflow: hidden; border-radius: 50%; margin-right: -25px">
            <img src="${avatar_url}" style="width: 30px; margin-left: -5px; margin-top: -2px"> 
          </div>`
          },
          useHTML: true,
          align: 'left'
        }]
      },
      series: {
        cursor: 'pointer',
        point: {
          events: {
            click: (event) => {
              this.router.navigate(['/copilot/seats', (event.point as any).login || event.point.name]);
            }
          }
        }
      }
    }
  }

  constructor(
    private router: Router
  ) { }

  ngOnChanges() {
    console.log('ngOnChanges', this.data);
    this._chartOptions = Object.assign({}, this.chartOptions, this._chartOptions);
    if (this._chartOptions?.series && this.data) {
      // Create an array with [total_time, login, avatar_url] for each point
      const seriesData = this.data.map(user => [
        user.total_time,
        user.login,
        user.avatar_url
      ]);
      (this._chartOptions?.series as Highcharts.SeriesBarOptions[])[0].data = seriesData;
      this.updateFlag = true;
    }
  }
}