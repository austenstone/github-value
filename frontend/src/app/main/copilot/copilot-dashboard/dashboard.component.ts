import { Component, OnInit } from '@angular/core';
import { AppModule } from '../../../app.module';
import { DashboardCardBarsComponent } from "./dashboard-card/dashboard-card-bars/dashboard-card-bars.component";
import { DashboardCardValueComponent } from './dashboard-card/dashboard-card-value/dashboard-card-value.component';
import { DashboardCardDrilldownBarChartComponent } from './dashboard-card/dashboard-card-drilldown-bar-chart/dashboard-card-drilldown-bar-chart.component';
import { MetricsService } from '../../../services/metrics.service';
import { CopilotMetrics } from '../../../services/metrics.service.interfaces';
import { ActivityResponse, Seat, SeatService } from '../../../services/seat.service';
import { MembersService } from '../../../services/members.service';
import { CopilotSurveyService, Survey } from '../../../services/copilot-survey.service';
import { forkJoin } from 'rxjs';
import { AdoptionChartComponent } from '../copilot-value/adoption-chart/adoption-chart.component';
import { DailyActivityChartComponent } from '../copilot-value/daily-activity-chart/daily-activity-chart.component';
import { TimeSavedChartComponent } from '../copilot-value/time-saved-chart/time-saved-chart.component';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { ActiveUsersChartComponent } from './dashboard-card/active-users-chart/active-users-chart.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { NewCardComponent } from './dashboard-card/new-card/new-card.component';

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
    ActiveUsersChartComponent,
    MatGridListModule,
    MatTabsModule,
    MatCardModule,
    NewCardComponent
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

  tiles = [
    {text: 'One', cols: 1, rows: 1},
    {text: 'Two', cols: 1, rows: 1},
    {text: 'Three', cols: 1, rows: 1},
    {text: 'Four', cols: 1, rows: 1},
    {text: 'Five', cols: 1, rows: 1},
    {text: 'Six', cols: 1, rows: 1},
    {text: 'Seven', cols: 1, rows: 1},
    {text: 'Eight', cols: 1, rows: 1},
    {text: 'Nine', cols: 1, rows: 1},
    {text: 'Ten', cols: 1, rows: 1},
    {text: 'Eleven', cols: 1, rows: 1},
    {text: 'Twelve', cols: 1, rows: 1},
  ];

  statusChecks = [
    // First column: Telemetry
    { title: 'API Connectivity', statusMessage: 'Unknown  ❌' },
    { title: 'Form Hits', statusMessage: 'Unknown  ❌' },
    { title: 'Settings Configured', statusMessage: 'Unknown  ❌' },
    // Second column: Developer Estimates
    { title: 'Polling History', statusMessage: 'Unknown  ❌' },
    { title: 'Repositories Configured', statusMessage: 'Unknown  ❌' },
    { title: 'Targets Selected', statusMessage: 'Unknown  ❌' },
    // Third column: Predictive Modeling
    { title: 'Average Usage Level', statusMessage: 'Unknown  ❌' },
    { title: 'Estimates Collected', statusMessage: 'Unknown  ❌' },
    { title: 'Targets Last Updated', statusMessage: 'Unknown  ❌' },
    // Additional Checks
    { title: 'Usage Level Trend', statusMessage: 'Unknown  ❌' },
    { title: 'Estimates/Daily-User Ratio', statusMessage: 'Unknown  ❌' },
    { title: 'Target Levels Acquired', statusMessage: '0 Levels Acquired ❌' }
  ];

  constructor(
    private metricsService: MetricsService,
    private membersService: MembersService,
    private seatService: SeatService,
    private surveyService: CopilotSurveyService
  ) { }

  ngOnInit() {
    console.log('Tiles:', this.tiles);
    console.log('Activity Data:', this.activityData);
    console.log('Metrics Data:', this.metricsData);

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const formattedSince = since.toISOString().split('T')[0];

    this.surveyService.getAllSurveys().subscribe(data => {
      this.surveysData = data;
      this.totalSurveys = data.length;
      this.totalSurveysThisWeek = data.reduce((acc, survey) => {
        const surveyDate = new Date(survey.createdAt!);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return surveyDate > oneWeekAgo ? acc + 1 : acc;
      }, 0);
      this.updateStatusChecks();
    });

    forkJoin({
      members: this.membersService.getAllMembers(),
      seats: this.seatService.getAllSeats()
    }).subscribe(result => {
      this.allSeats = result.seats;
      this.totalMembers = result.members.length;
      this.totalSeats = result.seats.length;
      this.seatPercentage = (this.totalSeats / this.totalMembers) * 100;
      this.updateStatusChecks();
    });

    this.seatService.getActivity(30).subscribe((activity) => {
      this.activityData = activity;
      this.updateStatusChecks();
    })

    this.seatService.getActivityTotals().subscribe(totals => {
      Object.keys(totals).forEach((key, index) => index > 10 ? delete totals[key] : null);
      this.activityTotals = totals;
      this.updateStatusChecks();
    });

    this.metricsService.getMetrics({
      since: formattedSince,
    }).subscribe(data => {
      this.metricsData = data;
      this.activeToday = data[data.length - 1].total_active_users;
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
      this.updateStatusChecks();
    });
  }

  updateStatusChecks() {
    // Update the statusChecks array with the fetched data
    this.statusChecks = [
      // First column: Telemetry
    { title: 'API Connectivity', statusMessage: 'Connected ✅' },
    { title: 'Form Hits', statusMessage: '36 hits ✅' },
    { title: 'Settings Configured', statusMessage: 'Complete ✅' },
    // Second column: Developer Estimates
    { title: 'Polling History', statusMessage: '5 days 🟠' },
    { title: 'Repositories Configured', statusMessage: '100 repos ✅' },
    { title: 'Targets Selected', statusMessage: 'Complete ✅' },
    // Third column: Predictive Modeling
    { title: 'Average Usage Level', statusMessage: '10 Daily Users 🟠' },
    { title: 'Estimates Collected', statusMessage: this.totalSurveys + ' estimates ✅' },
    { title: 'Targets Last Updated', statusMessage: '1 month ✅' },
    // Additional Checks
    { title: 'Usage Level Trend', statusMessage: 'Growing ✅' },
    { title: 'Estimates/Daily-User Ratio', statusMessage: '40% ✅' },
    { title: 'Target Levels Acquired', statusMessage: '0 Levels Acquired ❌' }
  ];
  }
}
