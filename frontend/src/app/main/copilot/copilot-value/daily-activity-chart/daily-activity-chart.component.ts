import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { ActivityResponse } from '../../../../services/api/seat.service';
import { CopilotMetrics } from '../../../../services/api/metrics.service.interfaces';
import { HighchartsService } from '../../../../services/highcharts.service';
import { Targets } from '../../../../services/api/targets.service';

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
  @Input() targets?: Targets;
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
            'IDE Suggestions': this.targets?.user.dailySuggestions.target || 0,
            'IDE Accepts': this.targets?.user.dailyAcceptances.target || 0,
            'IDE Chats': this.targets?.user.dailyChatTurns.target || 0,
            '.COM Chats': this.targets?.user.dailyDotComChats.target || 0,
            'IDE Acceptance Rate': 100 * ( this.targets?.user.dailyAcceptances.target || 0) / (this.targets?.user.dailySuggestions.target || 0),   // NEW
            'Pull Requests': this.targets?.user.weeklyPRSummaries.target  || 0  / 5  // 5 days in a week
          };

          // NEW: mapping for typical ranges (from, to)
          const typicalRangeMapping: Record<string, [number, number]> = {
            'IDE Suggestions': [50, 90],
            'IDE Accepts': [15, 40],
            'IDE Chats': [25, 40],
            '.COM Chats': [4, 8],
            'IDE Acceptance Rate': [20, 40],   // NEW – percentage range (example)
            'Pull Requests': [1, 3]       // NEW example range
          };

          // the code below is to set the target line on the chart, based on the series name
          // and the target value from the targets service. Target line only shows if the series is visible and other series are not
          let newTarget = 1000;
          let newTypicalFrom = 50;
          let newTypicalTo = 90;
          const visibleSeries = this.chart.series.filter(s => s.visible);

          if (visibleSeries.length === 1) {
            const series = visibleSeries[0];
            if (series.name && targetMapping[series.name]) {
              newTarget = targetMapping[series.name];
            }
            // NEW: select typical range limits
            if (series.name && typicalRangeMapping[series.name]) {
              [newTypicalFrom, newTypicalTo] = typicalRangeMapping[series.name];
            }
          }

          // Use chart instance to access yAxis
          const yAxis = this.chart.yAxis[0];
          const plotLineId = 'target-line';
          const plotBandId = 'typical-range';

          yAxis.removePlotLine(plotLineId);
          yAxis.removePlotBand?.(plotBandId);

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

          // also show typical range band only when one series is visible
          if (visibleSeries.length === 1) {
            yAxis.addPlotBand({
              id: plotBandId,
              from: newTypicalFrom,
              to: newTypicalTo,
              color: 'var(--sys-surface-variant)',
              label: {
                text: 'Typical Range',
                style: { color: 'var(--sys-on-surface-variant)' }
              },
              zIndex: 1
            });

            // NEW: tighten y-axis max for the lone series
            const dataMax = Math.max(
              ...visibleSeries[0].data.filter(v => typeof v === 'number') as number[]
            );
            const proposedMax = Math.max(dataMax, newTarget, newTypicalTo) * 1.15; // 15 % head-room
            
            yAxis.setExtremes(undefined, proposedMax, false);
          } else {
            // reset to auto when multiple series are active
            yAxis.setExtremes(undefined, undefined, false);
          }
        }
      }
    },
    yAxis: {
      title: {
        text: 'Daily Activity (per Avg User)'
      },
      min: 0,
      maxPadding: 0.2,   // was 1.2 – shrink default empty space
      plotBands: []      // start with no typical-range band
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
    series: [
      { name: 'IDE Suggestions',      type: 'spline', data: [], zIndex: 5 },
      { name: 'IDE Accepts',          type: 'spline', data: [], zIndex: 4 },
      { name: 'IDE Acceptance Rate',  type: 'spline', data: [], zIndex: 3 },
      { name: 'IDE Chats',            type: 'spline', data: [], color: '#00E676', zIndex: 5 },
      { name: '.COM Chats',           type: 'spline', data: [], color: '#E91E63', zIndex: 4 },
      { name: 'Pull Requests',        type: 'spline', data: [], color: '#9C27B0', zIndex: 3 }
    ],
    plotOptions: {
      series: {
        events: {
          legendItemClick: function () {
            const chart = this.chart as Highcharts.Chart & { _isolated?: Highcharts.Series };

            // if this series is already isolated → restore all
            if (chart._isolated === this) {
              chart.series.forEach(s => s.setVisible(true, false));
              chart._isolated = undefined;
            } else {
              // isolate the clicked series
              chart.series.forEach(s => s.setVisible(s === this, false));
              chart._isolated = this;
            }

            chart.redraw(false);
            return false; // prevent default toggle
          }
        }
      }
    }
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
      // toggle so <highcharts-chart> detects a change
      this.updateFlag = !this.updateFlag;
    }
  }

  onChartInstance(chart: Highcharts.Chart) {
    this.chart = chart;
    this.chartInstanceChange.emit(chart);
  }
}
