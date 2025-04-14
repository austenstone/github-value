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

  constructor(
    private copilotSeatService: SeatService,
    private activatedRoute: ActivatedRoute,
    private highchartsService: HighchartsService,
    private cdr: ChangeDetectorRef
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
        // No since parameter means all time
        params = { };
        break;
    }

    // Fetch seat activity data using the ID and time range parameters
    this.copilotSeatService.getSeat(this.id, params).subscribe({
      next: (seatActivity: Seat[]) => {  // Add type annotation here
        // Store the retrieved activity data
        this.seatActivity = seatActivity;
        
        // Set the current seat to the most recent activity record
        this.seat = seatActivity.length > 0 ? 
          seatActivity[seatActivity.length - 1] : 
          undefined;

        // Transform the activity data into Highcharts Gantt chart format
        this._chartOptions = this.highchartsService.transformSeatActivityToGantt(seatActivity);
        
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
      error: (error: any) => {  // Add type annotation here
        console.error('Error loading seat activity:', error);
        // Hide loading indicator - SET TO FALSE even if there's an error
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Handles time range selection change
   */
  onTimeRangeChange() {
    this.loadData();
  }
}
