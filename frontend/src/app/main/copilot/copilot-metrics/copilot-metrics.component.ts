import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { DateRangeSelectComponent } from "../../../shared/date-range-select/date-range-select.component";
import { MetricsService } from '../../../services/api/metrics.service';
import { CopilotMetrics } from '../../../services/api/metrics.service.interfaces';
import { CopilotMetricsPieChartComponent } from './copilot-metrics-pie-chart/copilot-metrics-pie-chart.component';
import { MatCardModule } from '@angular/material/card';
import { Installation, InstallationsService } from '../../../services/api/installations.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { DashboardCardDrilldownBarChartComponent } from '../copilot-dashboard/dashboard-card/dashboard-card-drilldown-bar-chart/dashboard-card-drilldown-bar-chart.component';
import { ActiveUsersChartComponent } from '../copilot-dashboard/dashboard-card/active-users-chart/active-users-chart.component';
import { ActivityTotals, SeatService } from '../../../services/api/seat.service';
import { MembersService } from '../../../services/api/members.service';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { DashboardCardLineChartComponent } from '../copilot-dashboard/dashboard-card/dashboard-card-line-chart/dashboard-card-line-chart.component';

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [
    DateRangeSelectComponent,
    CopilotMetricsPieChartComponent,
    MatCardModule,
    // DashboardCardBarsComponent,
    DashboardCardDrilldownBarChartComponent,
    ActiveUsersChartComponent,
    CommonModule,
    LoadingSpinnerComponent,
    DashboardCardLineChartComponent
  ],
  templateUrl: './copilot-metrics.component.html',
  styleUrls: [
    './copilot-metrics.component.scss',
    '../copilot-dashboard/dashboard.component.scss'
  ]
})
export class CopilotMetricsComponent implements OnInit, OnDestroy {
  metrics?: CopilotMetrics[];
  metricsTotals?: CopilotMetrics;
  installation?: Installation = undefined;
  activityTotals?: ActivityTotals[];
  totalSeats?: number;
  subscriptions: Subscription[] = [];
  private readonly _destroy$ = new Subject<void>();
  range?: { start: Date, end: Date };

  constructor(
    private metricsService: MetricsService,
    private installationsService: InstallationsService,
    private seatService: SeatService,
    private cdr: ChangeDetectorRef,
    private membersService: MembersService
  ) { }

  ngOnInit() {
    this.installationsService.currentInstallation.pipe(
      takeUntil(this._destroy$.asObservable())
    ).subscribe(installation => {
      this.installation = installation;
      if (this.range) {
        this.dateRangeChange(this.range);
      }
    });
  }

  ngOnDestroy() {
    this.reset();
    this._destroy$.next();
    this._destroy$.complete();
  }

  reset() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.metrics = undefined;
    this.metricsTotals = undefined;
    this.activityTotals = undefined;
    this.totalSeats = undefined;
  }

  dateRangeChange(event: { start: Date, end: Date }) {
    const utcStart = Date.UTC(event.start.getFullYear(), event.start.getMonth(), event.start.getDate());
    const utcEnd = Date.UTC(event.end.getFullYear(), event.end.getMonth(), event.end.getDate());
    const startModified = new Date(utcStart - 1);
    const endModified = new Date(utcEnd + 1);

    this.reset();

    this.subscriptions.push(
      this.seatService.getActivityTotals({
        org: this.installation?.account?.login,
        since: event.start.toISOString(),
        until: event.end.toISOString()
      }).subscribe(totals => {
        this.activityTotals = totals.length > 10 ? totals.slice(0, 10) : totals;
        this.cdr.detectChanges();
      })
    )

    this.subscriptions.push(
      this.metricsService.getMetrics({
        org: this.installation?.account?.login,
        since: startModified.toISOString(),
        until: endModified.toISOString()
      }).subscribe((metrics) => {
        this.metrics = metrics;
      })
    )

    this.subscriptions.push(
      this.metricsService.getMetricsTotals({
        org: this.installation?.account?.login,
        since: startModified.toISOString(),
        until: endModified.toISOString()
      }).subscribe((metricsTotals) => {
        this.metricsTotals = metricsTotals;
      })
    )
  }
}
