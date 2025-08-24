import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';
import HC_gantt from 'highcharts/modules/gantt';
HC_gantt(Highcharts);
import { HighchartsChartModule } from 'highcharts-angular';
import { Seat, SeatService } from '../../../../services/api/seat.service';
import { ActivatedRoute } from '@angular/router';
import { HighchartsService } from '../../../../services/highcharts.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CopilotSurveyService, Survey } from '../../../../services/api/copilot-survey.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
dayjs.extend(duration);
dayjs.extend(relativeTime);

type TimeRange = '7days' | '30days' | 'all';

@Component({
  selector: 'app-copilot-seat',
  standalone: true,
  imports: [
    HighchartsChartModule,
    MatCardModule,
    CommonModule,
    MatButtonToggleModule,
    FormsModule
  ],
  templateUrl: './copilot-seat.component.html',
  styleUrl: './copilot-seat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopilotSeatComponent implements OnInit {
  Highcharts: typeof Highcharts = Highcharts;
  updateFlag = false;
  chartOptions: Highcharts.Options = {
    title: {
      text: "Seat Activity by Editor"
    },
    xAxis: {
      type: "datetime"
    },
    legend: {
      enabled: false
    },
    series: [
      {
        name: "Seat Activity",
        type: "gantt",
        data: []
      }
    ],
    plotOptions: {
      gantt: {
        borderWidth: 0,
        borderColor: undefined,
        dataLabels: {
          enabled: true
        }
      }
    },
    tooltip: {},
    yAxis: {
      categories: [
        "vscode",
        "copilot-summarization-pr"
      ]
    }
  }
  chart2Options: Highcharts.Options = {
    title: {
      text: "Seat Activity by Editor"
    },
    xAxis: {
      type: "datetime"
    },
    legend: {
      enabled: false
    },
    series: [
      {
        name: "Seat Activity",
        type: "gantt",
        data: []
      }
    ],
    plotOptions: {
      gantt: {
        borderWidth: 0,
        borderColor: undefined,
        dataLabels: {
          enabled: true
        }
      }
    },
    tooltip: {},
    yAxis: {
      categories: [
        "vscode",
        "copilot-summarization-pr"
      ]
    }
  }
  id?: number | string;
  seat?: Seat;
  seatActivity?: Seat[];
  timeSpent?: string;
  selectedTimeRange: TimeRange = '7days';
  loading = false;
  surveyCount = 0;
  avgTimeSavings = 'N/A';

  constructor(
    private copilotSeatService: SeatService,
    private activatedRoute: ActivatedRoute,
    private highchartsService: HighchartsService,
    private cdr: ChangeDetectorRef,
    private surveyService: CopilotSurveyService
  ) { }

  ngOnInit() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (!id) return;
    this.id = id;

    this.loadData();
  }

  loadData() {
    if (!this.id) return;
    this.loading = true;

    let params: { since?: string; until?: string } = {};
    const until = dayjs().toISOString();

    switch (this.selectedTimeRange) {
      case '7days':
        params = { since: dayjs().subtract(7, 'day').toISOString(), until };
        break;
      case '30days':
        params = { since: dayjs().subtract(30, 'day').toISOString(), until };
        break;
      case 'all':
        params = {
          since: dayjs().subtract(5, 'year').toISOString(),
          until
        };
        break;
    }

    this.copilotSeatService.getSeat(this.id, params).pipe(
      map(seatData => {
        this.seatActivity = seatData;

        if (seatData.length > 0) {
          this.seat = seatData[seatData.length - 1];
          return this.seat?.assignee?.login;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error loading seat data:', error);
        return of(null);
      })
    ).subscribe(login => {
      if (!login) {
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }

      this.surveyService.getAllSurveys({
        since: params.since,
        until: params.until,
        userId: login
      }).pipe(
        catchError(error => {
          this.loading = false;
          this.cdr.detectChanges();
          console.error('Error loading survey data:', error);
          return of([] as Survey[]);
        }),
      ).subscribe(surveys => {
        const surveysArray = Array.isArray(surveys) ? surveys : [surveys];
        this.surveyCount = surveysArray.length;

        if (this.surveyCount > 0) {
          const totalTimeSavings = surveysArray.reduce((sum: number, survey: Survey) =>
            sum + (survey.percentTimeSaved || 0), 0);
          const avgSavings = totalTimeSavings / this.surveyCount;
          this.avgTimeSavings = avgSavings.toFixed(1) + '%';
        }

        this.chartOptions = {
          ...this.chartOptions,
          ...this.highchartsService.transformSeatActivityToGantt(this.seatActivity || [])
        };

        this.chart2Options = {
          ...this.chart2Options,
          ...this.highchartsService.transformSeatActivityToScatter(this.seatActivity || [])
        };

        this.timeSpent = " ~ " + Math.floor(dayjs.duration({
          milliseconds: (this.chartOptions.series as Highcharts.SeriesGanttOptions[])?.reduce((total, series) => {
            return total += series.data?.reduce((dataTotal, data) => dataTotal += (data.end || 0) - (data.start || 0), 0) || 0;
          }, 0)
        }).asHours()).toString() + " hrs"; // Formatted as hours

        this.loading = false;

        this.updateFlag = true;
        this.cdr.detectChanges();
      });
    });
  }

  onTimeRangeChange() {
    this.loadData();
  }
}
