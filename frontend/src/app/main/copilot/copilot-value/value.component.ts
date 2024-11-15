import { Component, OnInit } from '@angular/core';
import { AppModule } from '../../../app.module';
import { AdoptionChartComponent } from "./adoption-chart/adoption-chart.component";
import { ActivityResponse, SeatService } from '../../../services/seat.service';
import { DailyActivityChartComponent } from './daily-activity-chart/daily-activity-chart.component';
import { TimeSavedChartComponent } from './time-saved-chart/time-saved-chart.component';
import { CopilotMetrics } from '../../../services/metrics.service.interfaces';
import { MetricsService } from '../../../services/metrics.service';

@Component({
  selector: 'app-value',
  standalone: true,
  imports: [
    AppModule,
    AdoptionChartComponent,
    DailyActivityChartComponent,
    TimeSavedChartComponent
  ],
  templateUrl: './value.component.html',
  styleUrl: './value.component.scss'
})
export class CopilotValueComponent implements OnInit {
  activityData?: ActivityResponse;
  metricsData?: CopilotMetrics[];
  constructor(
    private seatService: SeatService,
    private metricsService: MetricsService
  ) { }

  ngOnInit() {
    this.seatService.getActivity().subscribe(data => {
      this.activityData = data;
    });
    this.metricsService.getMetrics().subscribe(data => {
      this.metricsData = data;
    });
  }
}
