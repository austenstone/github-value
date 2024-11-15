import { Component, OnInit } from '@angular/core';
import { AppModule } from '../../../app.module';
import { DashboardCardBarsComponent } from "./dashboard-card/dashboard-card-bars/dashboard-card-bars.component";
import { DashboardCardValueComponent } from './dashboard-card/dashboard-card-value/dashboard-card-value.component';
import { DashboardCardDrilldownBarChartComponent } from './dashboard-card/dashboard-card-drilldown-bar-chart/dashboard-card-drilldown-bar-chart.component';
import { MetricsService } from '../../../services/metrics.service';
import { CopilotMetrics } from '../../../services/metrics.service.interfaces';
import { SeatService } from '../../../services/seat.service';
import { MembersService } from '../../../services/members.service';
import { CopilotSurveyService } from '../../../services/copilot-survey.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AppModule,
    DashboardCardValueComponent,
    DashboardCardBarsComponent,
    DashboardCardDrilldownBarChartComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class CopilotDashboardComponent implements OnInit {
  totalMembers?: number;
  totalSeats?: number;
  totalSurveys?: number;
  totalSurveysThisWeek?: number;
  metricsData?: CopilotMetrics[];
  seatPercentage?: number;
  activeToday?: number;
  activeWeeklyChangePercent?: number;
  activeCurrentWeekAverage?: number;
  activeLastWeekAverage?: number;

  constructor(
    private metricsService: MetricsService,
    private membersService: MembersService,
    private seatService: SeatService,
    private surveyService: CopilotSurveyService
  ) { }

  ngOnInit() {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const formattedSince = since.toISOString().split('T')[0];

    this.surveyService.getAllSurveys().subscribe(data => {
      this.totalSurveys = data.length;
      this.totalSurveysThisWeek = data.reduce((acc, survey) => {
        const surveyDate = new Date(survey.dateTime);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return surveyDate > oneWeekAgo ? acc + 1 : acc;
      }, 0);
    });

    forkJoin({
      members: this.membersService.getAllMembers(),
      seats: this.seatService.getAllSeats()
    }).subscribe(result => {
      this.totalMembers = result.members.length;
      this.totalSeats = result.seats.length;
      this.seatPercentage = (this.totalSeats / this.totalMembers) * 100;
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
    });
  }
}
