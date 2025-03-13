import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { ActivityResponse } from '../../../../services/api/seat.service';
import { HighchartsService } from '../../../../services/highcharts.service';
import { DatePipe } from '@angular/common';
import { TargetsGridType } from '../../../../services/api/targets.service';

@Component({
  selector: 'app-adoption-chart',
  standalone: true,
  imports: [
    HighchartsChartModule
  ],
  providers: [
    DatePipe
  ],
  templateUrl: './adoption-chart.component.html',
  styleUrl: './adoption-chart.component.scss'
})
export class AdoptionChartComponent implements OnInit, OnChanges {
  Highcharts: typeof Highcharts = Highcharts;
  updateFlag = false;
  totalUsers = 500;
  @Input() data?: ActivityResponse;
  @Input() targets?: TargetsGridType;
  @Input() chartOptions?: Highcharts.Options;
  _chartOptions: Highcharts.Options = {
    yAxis: {
      title: {
        text: 'Adoption %'
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
    series: [{
      name: 'Users',
      type: 'spline',
      data: []
    }],
    tooltip: {
      headerFormat: '',
    },
    legend: {
      enabled: false
    },
  };
  @Output() chartInstanceChange = new EventEmitter<Highcharts.Chart>();
  chart?: Highcharts.Chart;

  constructor(
    private highchartsService: HighchartsService,
  ) { }

  ngOnInit() {
    this.chartInstanceChange.subscribe(chart => {
      this.chart = chart;
    });
    this._chartOptions.yAxis = Object.assign({}, this.chartOptions?.yAxis, this._chartOptions.yAxis);
    this._chartOptions.tooltip = Object.assign({}, this.chartOptions?.tooltip, this._chartOptions.tooltip);
    this._chartOptions = Object.assign({}, this.chartOptions, this._chartOptions);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data) {
      const options = this.highchartsService.transformActivityMetricsToLine(this.data);
      this._chartOptions = {
        ...this._chartOptions,
        ...options,
        tooltip: {
          ...options.tooltip,
          ...this._chartOptions.tooltip
        }
      };
    }
    if (changes['targets'] && this.targets) {
      if (this.targets?.target.adoptedDevs) {
        const target = (+this.targets.target.adoptedDevs / this.targets.max.seats) * 100;
        const yAxis = this._chartOptions.yAxis as Highcharts.YAxisOptions;
        if (yAxis?.plotLines?.[0]) {
          yAxis.plotLines[0].value = target;
        }
      }
      this.updateFlag = true;
      setTimeout(() => {
        (this.chart?.yAxis[0] as any).plotLinesAndBands[0].render();
      }, 5000)
    }
  }

}