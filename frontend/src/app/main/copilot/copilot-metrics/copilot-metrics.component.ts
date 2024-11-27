import { Component, OnInit } from '@angular/core';
import { DateRangeSelectComponent } from "../../../shared/date-range-select/date-range-select.component";
import { MetricsService } from '../../../services/api/metrics.service';
import { CopilotMetrics } from '../../../services/api/metrics.service.interfaces';
import { CopilotMetricsPieChartComponent } from './copilot-metrics-pie-chart/copilot-metrics-pie-chart.component';
import { MatCardModule } from '@angular/material/card';
import { Installation, InstallationsService } from '../../../services/api/installations.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [
    DateRangeSelectComponent,
    CopilotMetricsPieChartComponent,
    MatCardModule
  ],
  templateUrl: './copilot-metrics.component.html',
  styleUrls: [
    './copilot-metrics.component.scss',
    '../copilot-dashboard/dashboard.component.scss'
  ]
})
export class CopilotMetricsComponent implements OnInit {
  metrics?: CopilotMetrics[];
  metricsTotals?: CopilotMetrics;
  installation?: Installation = undefined;

  constructor(
    private metricsService: MetricsService,
    private installationsService: InstallationsService
  ) { }

  ngOnInit() {
    this.installationsService.currentInstallation.pipe(
      takeUntil(this.installationsService.destroy$)
    ).subscribe(installation => {
      this.installation = installation;
    });
  }

  dateRangeChange(event: {start: Date, end: Date}) {
    const utcStart = Date.UTC(event.start.getFullYear(), event.start.getMonth(), event.start.getDate());
    const utcEnd = Date.UTC(event.end.getFullYear(), event.end.getMonth(), event.end.getDate());
    const startModified = new Date(utcStart - 1);
    const endModified = new Date(utcEnd + 1);

    this.metricsService.getMetrics({
      org: this.installation?.account?.login,
      since: startModified.toISOString(),
      until: endModified.toISOString()
    }).subscribe((metrics) => {
      this.metrics = metrics;
    });
    this.metricsService.getMetricsTotals({
      org: this.installation?.account?.login,
      since: startModified.toISOString(),
      until: endModified.toISOString()
    }).subscribe((metricsTotals) => {
      this.metricsTotals = metricsTotals;
    })
  }
}
