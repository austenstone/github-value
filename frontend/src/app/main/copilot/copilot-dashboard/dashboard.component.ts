import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AppModule } from '../../../app.module';
import { DashboardCardValueComponent } from './dashboard-card/dashboard-card-value/dashboard-card-value.component';
import { MetricsService } from '../../../services/api/metrics.service';
import { CopilotMetrics } from '../../../services/api/metrics.service.interfaces';
import { ActivityResponse, Seat, SeatService } from '../../../services/api/seat.service';
import { MembersService } from '../../../services/api/members.service';
import { CopilotSurveyService, Survey } from '../../../services/api/copilot-survey.service';
import { forkJoin, Subject, Subscription, takeUntil } from 'rxjs';
import { AdoptionChartComponent } from '../copilot-value/adoption-chart/adoption-chart.component';
import { DailyActivityChartComponent } from '../copilot-value/daily-activity-chart/daily-activity-chart.component';
import { TimeSavedChartComponent } from '../copilot-value/time-saved-chart/time-saved-chart.component';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { InstallationsService } from '../../../services/api/installations.service';
import { StatusComponent } from './status/status.component';
import { Targets, TargetsService } from '../../../services/api/targets.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AppModule,
    // DashboardCardValueComponent,
    AdoptionChartComponent,
    DailyActivityChartComponent,
    TimeSavedChartComponent,
    LoadingSpinnerComponent,
    StatusComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class CopilotDashboardComponent implements OnInit, OnDestroy {
  subscriptions = [] as Subscription[];
  metricsData?: CopilotMetrics[];
  activityData?: ActivityResponse;
  targetsData?: Targets;
  surveysData?: Survey[];
  chartOptions: Highcharts.Options = {
    chart: {
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
    },
    legend: {
      enabled: false,
    },
    xAxis: {
      crosshair: true,
      visible: false,
    },
    yAxis: {
      visible: false,
      title: undefined
    },
    tooltip: {
      positioner: function () {
        return { x: 4, y: -10 };
      },
      backgroundColor: undefined
    },
    plotOptions: {
      spline: {
        lineWidth: 4,
        marker: {
          enabled: false,
          fillColor: 'transparent',
          color: 'transparent',
          lineColor: 'transparent',
          fillOpacity: 0,
        },
      }
    }
  }
  private readonly _destroy$ = new Subject<void>();

  activityTotals?: Record<string, number>;
  status?: any;
  statuses = [] as {
    title: string,
    message: string,
    status: 'success' | 'error' | 'warning'
  }[];
  statusChecks = [
    // First column: Telemetry
    { title: 'API Connectivity', statusMessage: 'Unknown' },
    { title: 'Form Hits', statusMessage: 'Unknown' },
    { title: 'Settings Configured', statusMessage: 'Unknown' },
    // Second column: Developer Estimates
    { title: 'Polling History', statusMessage: 'Unknown' },
    { title: 'Repositories Configured', statusMessage: 'Unknown' },
    { title: 'Targets Selected', statusMessage: 'Unknown' },
    // Third column: Predictive Modeling
    { title: 'Average Usage Level', statusMessage: 'Unknown' },
    { title: 'Estimates Collected', statusMessage: 'Unknown' },
    { title: 'Targets Last Updated', statusMessage: 'Unknown' },
    // Additional Checks
    { title: 'Usage Level Trend', statusMessage: 'Unknown' },
    { title: 'Estimates/Daily-User Ratio', statusMessage: 'Unknown' },
    { title: 'Target Levels Acquired', statusMessage: '0 Levels Acquired' }
  ];


  constructor(
    private metricsService: MetricsService,
    private membersService: MembersService,
    private seatService: SeatService,
    private surveyService: CopilotSurveyService,
    private installationsService: InstallationsService,
    private targetsService: TargetsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const formattedSince = since.toISOString().split('T')[0];

    this.installationsService.currentInstallation.pipe(
      takeUntil(this._destroy$.asObservable())
    ).subscribe(installation => {
      this.subscriptions.forEach(s => s.unsubscribe());
      this.metricsData = undefined;
      this.activityData = undefined;
      this.statuses = [];

      this.subscriptions.push(
        this.installationsService.getStatus2().subscribe(status => {
          this.status = status;
          this.statuses[0] = {
            title: 'GitHub App',
            message: status.installations.reduce((acc: number, i: any) => acc += i.repos.length, 0) + ' repositories',
            status: status.installations.length > 0 ? 'success' : 'error'
          };
          this.statuses[1] = {
            title: 'Polling History',
            message: status.seatsHistory.daysSinceOldestCreatedAt + ' days',
            status: status.seatsHistory.daysSinceOldestCreatedAt > 30 ? 'success' : status.seatsHistory.daysSinceOldestCreatedAt > 5 ? 'warning' : 'error'
          };
        })
      );

      this.subscriptions.push(
        this.surveyService.getAllSurveys().subscribe(data => {
          this.surveysData = data;
          this.cdr.detectChanges();
          this.statuses[2] = {
            title: 'Estimates Collected',
            message: this.surveysData.length + ' estimates',
            status: this.surveysData.length > 0 ? 'success' : 'warning'
          }
        })
      )

      this.subscriptions.push(
        this.seatService.getActivity(installation?.account?.login).subscribe((activity) => {
          //TODO: remove this
          this.activityData = activity;
          this.cdr.detectChanges();
        })
      )

      this.subscriptions.push(
        this.metricsService.getMetrics({
          org: installation?.account?.login,
          since: formattedSince,
        }).subscribe(data => {
          this.metricsData = data;
          this.cdr.detectChanges();
        })
      )

      this.subscriptions.push(
        this.targetsService.getTargets().subscribe(data => {
          this.targetsData = data;
          console.log('Dashboard targets loaded:', data);   // DEBUG
          this.cdr.detectChanges();
        })
      );

    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this._destroy$.next();
    this._destroy$.complete();
  }
}
