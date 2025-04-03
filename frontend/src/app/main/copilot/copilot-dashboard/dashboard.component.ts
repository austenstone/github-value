import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AppModule } from '../../../app.module';
import { MetricsService } from '../../../services/api/metrics.service';
import { CopilotMetrics } from '../../../services/api/metrics.service.interfaces';
import { ActivityResponse, SeatService } from '../../../services/api/seat.service';
import { MembersService } from '../../../services/api/members.service';
import { CopilotSurveyService, Survey } from '../../../services/api/copilot-survey.service';
import { InstallationsService, SystemStatus } from '../../../services/api/installations.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { AdoptionChartComponent } from '../copilot-value/adoption-chart/adoption-chart.component';
import { DailyActivityChartComponent } from '../copilot-value/daily-activity-chart/daily-activity-chart.component';
import { TimeSavedChartComponent } from '../copilot-value/time-saved-chart/time-saved-chart.component';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { StatusComponent } from './status/status.component';
import { getStatusInfo } from './status-checks';

interface Status {
  title: string;
  message: string;
  status: 'error' | 'success' | 'warning';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AppModule,
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

  systemStatus?: SystemStatus;
  statuses = [] as Status[];

  constructor(
    private metricsService: MetricsService,
    private membersService: MembersService,
    private seatService: SeatService,
    private surveyService: CopilotSurveyService,
    private installationsService: InstallationsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const formattedSince = since.toISOString().split('T')[0];

    this.installationsService.getCurrentInstallation().pipe(
      takeUntil(this._destroy$.asObservable())
    ).subscribe(installation => {
      this.subscriptions.forEach(s => s.unsubscribe());
      this.metricsData = undefined;
      this.activityData = undefined;
      this.statuses = [];

      this.subscriptions.push(
        this.installationsService.refreshStatus().subscribe(status => {
          this.systemStatus = status;
          this.updateStatusChecks();
        })
      );

      this.subscriptions.push(
        this.surveyService.getAllSurveys().subscribe(data => {
          this.surveysData = data;
          this.cdr.detectChanges();
          this.updateStatusChecks();
        })
      );

      this.subscriptions.push(
        this.seatService.getActivity(installation?.account?.login).subscribe((activity) => {
          this.activityData = activity;
          this.cdr.detectChanges();
        })
      );

      this.subscriptions.push(
        this.metricsService.getMetrics({
          org: installation?.account?.login,
          since: formattedSince,
        }).subscribe(data => {
          this.metricsData = data;
          this.cdr.detectChanges();
        })
      );
    });
  }

  private updateStatusChecks() {
    if (!this.systemStatus) return;

    this.statuses = getStatusInfo(this.systemStatus, this.surveysData);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
    this._destroy$.next();
    this._destroy$.complete();
  }
}
