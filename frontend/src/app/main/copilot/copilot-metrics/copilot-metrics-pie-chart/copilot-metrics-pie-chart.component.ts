import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';
import { CopilotMetrics } from '../../../../services/api/metrics.service.interfaces';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { HighchartsService } from '../../../../services/highcharts.service';

@Component({
    selector: 'app-copilot-metrics-ide-completion-pie-chart',
    standalone: true,
    imports: [
        HighchartsChartModule
    ],
    template: `<highcharts-chart [Highcharts]="Highcharts" [options]="chartOptions" [(update)]="updateFlag">
</highcharts-chart>`,
    // styleUrl: './copilot-metrics-ide-completion-pie-chart.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopilotMetricsPieChartComponent implements OnChanges {
    Highcharts: typeof Highcharts = Highcharts;
    @Input() metricsTotals?: CopilotMetrics;
    chartOptions: Highcharts.Options = {
        tooltip: {
            positioner: function () {
              return { x: 0, y: 0 };
            },
            outside: true,
            backgroundColor: undefined,
            headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
            pointFormat: '<span style="color:{point.color}">{point.name}</span>: ' +
                '<b>{point.y:.2f}%</b> of total<br/>'
        },
        series: [{
            type: 'pie',
        }, {
            type: 'pie',
        }],
        drilldown: {
            series: []
        }
    };
    _chartOptions?: Highcharts.Options;
    updateFlag = false;

    constructor(
        private highchartsService: HighchartsService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnChanges() {
        if (this.metricsTotals) {
            this.chartOptions = {
                ...this.chartOptions,
                ...this.highchartsService.transformMetricsToPieDrilldown(this.metricsTotals)
            };
            this.updateFlag = true;
            this.cdr.detectChanges();
        }
    }
}
