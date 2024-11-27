import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AppModule } from '../../../app.module';
import { DashboardCardBarsComponent } from "./dashboard-card/dashboard-card-bars/dashboard-card-bars.component";
import { DashboardCardValueComponent } from './dashboard-card/dashboard-card-value/dashboard-card-value.component';
import { DashboardCardDrilldownBarChartComponent } from './dashboard-card/dashboard-card-drilldown-bar-chart/dashboard-card-drilldown-bar-chart.component';
import { MetricsService } from '../../../services/api/metrics.service';
import { CopilotMetrics } from '../../../services/api/metrics.service.interfaces';
import { ActivityResponse, Seat, SeatService } from '../../../services/api/seat.service';
import { MembersService } from '../../../services/api/members.service';
import { CopilotSurveyService, Survey } from '../../../services/api/copilot-survey.service';
import { forkJoin, takeUntil } from 'rxjs';
import { AdoptionChartComponent } from '../copilot-value/adoption-chart/adoption-chart.component';
import { DailyActivityChartComponent } from '../copilot-value/daily-activity-chart/daily-activity-chart.component';
import { TimeSavedChartComponent } from '../copilot-value/time-saved-chart/time-saved-chart.component';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { ActiveUsersChartComponent } from './dashboard-card/active-users-chart/active-users-chart.component';
import { InstallationsService } from '../../../services/api/installations.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AppModule,
    DashboardCardValueComponent,
    DashboardCardBarsComponent,
    DashboardCardDrilldownBarChartComponent,
    AdoptionChartComponent,
    DailyActivityChartComponent,
    TimeSavedChartComponent,
    LoadingSpinnerComponent,
    ActiveUsersChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class CopilotDashboardComponent implements OnInit {
  allSeats?: Seat[];
  totalMembers?: number;
  totalSeats?: number;
  surveysData?: Survey[];
  totalSurveys?: number;
  totalSurveysThisWeek?: number;
  metricsData?: CopilotMetrics[];
  activityData?: ActivityResponse;
  seatPercentage?: number;
  activeToday?: number;
  activeWeeklyChangePercent?: number;
  activeCurrentWeekAverage?: number;
  activeLastWeekAverage?: number;
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

  activityTotals?: Record<string, number>;

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

    this.installationsService.currentInstallation.pipe(
      takeUntil(this.installationsService.destroy$)
    ).subscribe(installation => {
      this.activityTotals = undefined;
      this.allSeats = undefined;
      this.totalMembers = undefined;
      this.totalSeats = undefined;
      this.seatPercentage = undefined;
      this.activeToday = undefined;
      this.activeWeeklyChangePercent = undefined;
      this.activeCurrentWeekAverage = undefined;
      this.activeLastWeekAverage = undefined;
      this.totalSurveys = undefined;
      this.totalSurveysThisWeek = undefined;
      this.metricsData = undefined;
      this.activityData = undefined;
      this.surveysData = undefined;
      
      this.surveyService.getAllSurveys().subscribe(data => {
        this.surveysData = data;
        this.totalSurveys = data.length;
        this.totalSurveysThisWeek = data.reduce((acc, survey) => {
          const surveyDate = new Date(survey.createdAt!);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return surveyDate > oneWeekAgo ? acc + 1 : acc;
        }, 0);
        this.cdr.detectChanges();
      });

      forkJoin({
        members: this.membersService.getAllMembers(),
        seats: this.seatService.getAllSeats(installation?.account?.login)
      }).subscribe(result => {
        this.allSeats = result.seats;
        this.totalMembers = result.members.length;
        this.totalSeats = result.seats.length;
        this.seatPercentage = (this.totalSeats / this.totalMembers) * 100;
      });

      this.seatService.getActivity(installation?.account?.login, 30).subscribe((activity) => {
        this.activityData = activity;
        this.cdr.detectChanges();
      })

      this.seatService.getActivityTotals(installation?.account?.login).subscribe(totals => {
        Object.keys(totals).forEach((key, index) => index > 10 ? delete totals[key] : null);
        this.activityTotals = totals;
        this.cdr.detectChanges();
      });

      this.metricsService.getMetrics({
        org: installation?.account?.login,
        since: formattedSince,
      }).subscribe(data => {
        this.metricsData = data;
        this.activeToday = data[data.length - 1]?.total_active_users || 0;
        const currentWeekData = data.slice(-7);
        this.activeCurrentWeekAverage = currentWeekData.reduce((sum, day) =>
          sum + day.total_active_users, 0) / currentWeekData.length;
        const lastWeekData = data.slice(-14, -7);
        this.activeLastWeekAverage = lastWeekData.length > 0
          ? lastWeekData.reduce((sum, day) => sum + day.total_active_users, 0) / lastWeekData.length
          : 0;

        const percentChange = this.activeLastWeekAverage === 0
          ? 100
          : ((this.activeCurrentWeekAverage - this.activeLastWeekAverage) / this.activeLastWeekAverage) * 100;

        this.activeWeeklyChangePercent = Math.round(percentChange * 10) / 10;
        this.cdr.detectChanges();
      });
    });
  }
}
