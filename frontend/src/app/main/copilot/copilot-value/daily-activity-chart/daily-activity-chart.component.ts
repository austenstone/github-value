import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { ActivityResponse } from '../../../../services/api/seat.service';
import { CopilotMetrics } from '../../../../services/api/metrics.service.interfaces';
import { HighchartsService } from '../../../../services/highcharts.service';
import { TargetsGridType } from '../../../../services/api/targets.service';

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
  @Input() targets?: TargetsGridType;
  @Input() metrics?: CopilotMetrics[];
  @Input() chartOptions?: Highcharts.Options;
  @Output() chartInstanceChange = new EventEmitter<Highcharts.Chart>();
  private chart?: Highcharts.Chart;
  _chartOptions: Highcharts.Options = {
    chart: {
      events: {
        redraw: () => {
          if (!this.chart) return;

          // Mapping from series name to target values
          const targetMapping: Record<string, number> = {
            'IDE Suggestions': this.targets?.target.dailySuggestions || 0,
            'IDE Accepts': this.targets?.target.dailyAcceptances || 0,
            'IDE Chats': this.targets?.target.dailyChatTurns || 0,
            '.COM Chats': this.targets?.target.dailyDotComChats || 0
          };

          let newTarget = 1000;
          const visibleSeries = this.chart.series.filter(s => s.visible);

          if (visibleSeries.length === 1) {
            const series = visibleSeries[0];
            if (series.name && targetMapping[series.name]) {
              newTarget = targetMapping[series.name];
            }
          }

          // Use chart instance to access yAxis
          const yAxis = this.chart.yAxis[0];
          const plotLineId = 'target-line';

          yAxis.removePlotLine(plotLineId);
          yAxis.addPlotLine({
            id: plotLineId,
            value: newTarget,
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
          });
        }
      }
    },
    yAxis: {
      title: {
        text: 'Daily Activity Per Avg User'
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
      name: 'IDE Suggestions',
      type: 'spline',
    }, {
      name: 'IDE Accepts',
      type: 'spline',
    }, {
      name: 'IDE Chats',
      type: 'spline',
    }, {
      name: '.COM Chats',
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

  onChartInstance(chart: Highcharts.Chart) {
    this.chart = chart;
    this.chartInstanceChange.emit(chart);
  }
}