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
  _chartOptions?: Highcharts.Options;
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
    // Extract the seat ID from the URL route parameters
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (!id) return; // Exit if no ID is found
    this.id = id;

    // Load the initial data with default timerange
    this.loadData();
  }

  /**
   * Loads seat activity data based on the selected time range
   */
  loadData() {
    if (!this.id) return;

    // Show loading indicator - SET TO TRUE at the start of data loading
    this.loading = true;
    this.cdr.detectChanges();

    let params: { since?: string; until?: string } = {};
    const until = dayjs().toISOString();

    // Set the since date based on the selected time range
    switch (this.selectedTimeRange) {
      case '7days':
        params = { since: dayjs().subtract(7, 'day').toISOString(), until };
        break;
      case '30days':
        params = { since: dayjs().subtract(30, 'day').toISOString(), until };
        break;
      case 'all':
        // Instead of empty params, use a far past date (e.g., 5 years ago)
        // This ensures we don't send 'undefined' to the API
        params = { 
          since: dayjs().subtract(5, 'year').toISOString(),
          until 
        };
        break;
    }

    // Create observables for all the data we need to fetch
    const seatActivity$ = this.copilotSeatService.getSeat(this.id, params);
    
    // First get the seat data to access the assignee login
    seatActivity$.pipe(
      map(seatData => {
        // Store the complete seat activity data
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
      // Now that we have the login, we can make the subsequent requests
      if (!login) {
        // Complete the process with default empty values if no login is available
        this.loading = false;
        this.cdr.detectChanges();
        return;
      }
      
      // We now have the login, use it for survey queries
      const surveyParams = {
        since: params.since,
        until: params.until,
        userId: login
      };
      
      const surveys$ = this.surveyService.getAllSurveys(surveyParams).pipe(
        catchError(error => {
          console.error('Error loading survey data:', error);
          return of([] as Survey[]);
        })
      );

      // Update forkJoin to only include surveys
      forkJoin({
        surveys: surveys$
      }).subscribe({
        next: (results) => {
          // Process survey data - ensure surveys is an array
          const surveysArray = Array.isArray(results.surveys) ? results.surveys : [results.surveys];
          this.surveyCount = surveysArray.length;
          
          if (this.surveyCount > 0) {
            const totalTimeSavings = surveysArray.reduce((sum: number, survey: Survey) => 
              sum + (survey.percentTimeSaved|| 0), 0);
            const avgSavings = totalTimeSavings / this.surveyCount;
            this.avgTimeSavings = avgSavings.toFixed(1) + '%';
          }

          // Transform the activity data into Highcharts Gantt chart format
          // Use the full seatActivity array, not just the current seat
          this._chartOptions = this.highchartsService.transformSeatActivityToGantt(this.seatActivity || []);
          
          // Merge the transformed options with default chart options
          this.chartOptions = {
            ...this.chartOptions,
            ...this._chartOptions
          };
          
          // Calculate total time spent based on Gantt data durations
          this.timeSpent = " ~ " + Math.floor(dayjs.duration({
            milliseconds: (this.chartOptions.series as Highcharts.SeriesGanttOptions[])?.reduce((total, series) => {
              return total += series.data?.reduce((dataTotal, data) => dataTotal += (data.end || 0) - (data.start || 0), 0) || 0;
            }, 0)
          }).asHours()).toString() + " hrs"; // Formatted as hours
          
          // Hide loading indicator - SET TO FALSE after successful data load
          this.loading = false;
          
          // Trigger chart update and refresh the component view
          this.updateFlag = true;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading data:', error);
          // Hide loading indicator - SET TO FALSE even if there's an error
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  /**
   * Handles time range selection change
   */
  onTimeRangeChange() {
    this.loadData();
  }
}
