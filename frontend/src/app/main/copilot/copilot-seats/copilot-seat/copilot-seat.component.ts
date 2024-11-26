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
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(duration);
dayjs.extend(relativeTime);

@Component({
  selector: 'app-copilot-seat',
  standalone: true,
  imports: [
    HighchartsChartModule,
    MatCardModule,
    CommonModule
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

  constructor(
    private copilotSeatService: SeatService,
    private activatedRoute: ActivatedRoute,
    private highchartsService: HighchartsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (!id) return;
    this.id = id;

    this.copilotSeatService.getSeat(this.id).subscribe(seatActivity => {
      this.seatActivity = seatActivity;
      this.seat = seatActivity[this.seatActivity.length - 1];

      this._chartOptions = this.highchartsService.transformSeatActivityToGantt(seatActivity);
      this.chartOptions = {
        ...this.chartOptions,
        ...this._chartOptions
      };
      this.timeSpent = dayjs.duration({
        milliseconds: (this.chartOptions.series as Highcharts.SeriesGanttOptions[])?.reduce((total, series) => {
          return total += series.data?.reduce((dataTotal, data) => dataTotal += (data.end || 0) - (data.start || 0), 0) || 0;
        }, 0)
      }).humanize();
      this.updateFlag = true;
      this.cdr.detectChanges();
    });

  }

}
