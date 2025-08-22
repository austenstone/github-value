import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { Survey } from '../../../../services/api/copilot-survey.service';
import { HighchartsService } from '../../../../services/highcharts.service';
import { ActivityResponse } from '../../../../services/api/seat.service';
import { Targets } from '../../../../services/api/targets.service';

@Component({
  selector: 'app-time-saved-chart',
  standalone: true,
  imports: [
    HighchartsChartModule
  ],
  templateUrl: './time-saved-chart.component.html',
  styleUrl: './time-saved-chart.component.scss'
})
export class TimeSavedChartComponent implements OnInit, OnChanges {
  @Input() surveys?: Survey[];
  @Input() targets?: Targets;
  @Input() activity?: ActivityResponse;
  @Input() chartOptions?: Highcharts.Options;
  @Output() chartInstanceChange = new EventEmitter<Highcharts.Chart>();
  Highcharts: typeof Highcharts = Highcharts;
  updateFlag = false;
  _chartOptions: Highcharts.Options = {
    yAxis: {
      title: {
        text: 'Time Saved (Hrs per Week)'
      },
      min: 0,
      max: 10, // Will be updated dynamically
      labels: {
        format: '{value}hrs'
      },
      plotBands: [{
        from: 4,
        to: 7,
        color: 'var(--sys-surface-variant)',
        label: {
          text: 'Typical Range',
          style: {
            color: 'var(--sys-on-surface-variant)'
          }
        }
      }],
      plotLines: [{
        value: 5, // Will be updated dynamically
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
      pointFormat: [
        '{series.name}: ',
        '<b>{point.y:.1f}hrs</b>'
      ].join(''),
      style: {
        fontSize: '14px'
      }
    },
    series: [{
      name: 'Time Saved',
      type: 'spline',
      data: []
    }, {
      type: 'scatter',
      name: 'Observations',
      data: []
    }],
    legend: {
      enabled: false
    }
  };

  constructor(
    private highchartsService: HighchartsService
  ) { }

  ngOnInit() {
    this._chartOptions.yAxis = Object.assign({}, this.chartOptions?.yAxis, this._chartOptions.yAxis);
    this._chartOptions.tooltip = Object.assign({}, this.chartOptions?.tooltip, this._chartOptions.tooltip);
    this._chartOptions = Object.assign({}, this.chartOptions, this._chartOptions);
    this.updateYAxisFromTargets();
  }

  ngOnChanges() {
    if (this.surveys) {
      this._chartOptions = {
        ...this._chartOptions,
        ...this.highchartsService.transformSurveysToScatter(this.surveys, this.activity)
      };
      this.updateFlag = true;
    }
    this.updateYAxisFromTargets();
  }

  private updateYAxisFromTargets() {
    if (this.targets?.user?.weeklyTimeSavedHrs) {
      const targetValue = this.targets.user.weeklyTimeSavedHrs.target;
      const maxValue = Math.max(
        targetValue * 1.5,
        this.targets.user.weeklyTimeSavedHrs.max || 10,
        10
      );
      const yAxis = {
        ...this._chartOptions.yAxis,
        max: maxValue,
        plotLines: [{
          value: targetValue,
          color: 'var(--sys-primary)',
          dashStyle: 'Dash' as Highcharts.DashStyleValue,
          width: 2,
          label: {
            text: 'Target Level',
            align: 'left' as Highcharts.AlignValue,
            style: {
              color: 'var(--sys-primary)'
            }
          },
          zIndex: 2
        }]
      };
      this._chartOptions = {
        ...this._chartOptions,
        yAxis
      };
      this.updateFlag = true;
    }
  }

}
