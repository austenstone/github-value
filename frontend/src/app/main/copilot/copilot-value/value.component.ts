import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AppModule } from '../../../app.module';
import { AdoptionChartComponent } from "./adoption-chart/adoption-chart.component";
import { ActivityResponse, SeatService } from '../../../services/api/seat.service';
import { DailyActivityChartComponent } from './daily-activity-chart/daily-activity-chart.component';
import { TimeSavedChartComponent } from './time-saved-chart/time-saved-chart.component';
import { CopilotMetrics } from '../../../services/api/metrics.service.interfaces';
import { MetricsService } from '../../../services/api/metrics.service';
import { FormControl } from '@angular/forms';
import { Subscription, takeUntil } from 'rxjs';
import { CopilotSurveyService, Survey } from '../../../services/api/copilot-survey.service';
import * as Highcharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';
HC_exporting(Highcharts);
import HC_full_screen from 'highcharts/modules/full-screen';
import { InstallationsService } from '../../../services/api/installations.service';
import { Targets, TargetsService } from '../../../services/api/targets.service';
HC_full_screen(Highcharts);

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
  styleUrls: [
    './value.component.scss',
    // '../copilot-dashboard/dashboard.component.scss'
  ]
})
export class CopilotValueComponent implements OnInit, OnDestroy {
  activityData?: ActivityResponse;
  metricsData?: CopilotMetrics[];
  targetsData?: Targets;
  surveysData?: Survey[];
  daysInactive = new FormControl(30);
  adoptionFidelity = new FormControl<'day' | 'hour'>('day');
  Highcharts: typeof Highcharts = Highcharts;
  charts = [] as Highcharts.Chart[];
  chartOptions: Highcharts.Options = {
    chart: {
      // spacingTop: 50,
      zooming: {
        type: 'x'
      },
      width: undefined,
    },
    xAxis: {
      type: 'datetime',
      dateTimeLabelFormats: {
        month: '%b',
        year: '%b'
      },
      crosshair: true
    },
    plotOptions: {
      series: {
        animation: {
          duration: 300
        }
      }
    },
    exporting: {
      enabled: true,
      buttons: {
        contextButton: {
          y: 0
        }
      }
    }
  };
  subscriptions = [] as Subscription[];

  constructor(
    private seatService: SeatService,
    private metricsService: MetricsService,
    private copilotSurveyService: CopilotSurveyService,
    private installationsService: InstallationsService,
    private targetsService: TargetsService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.installationsService.currentInstallation.pipe(
      takeUntil(this.installationsService.destroy$)
    ).subscribe(installation => {
      this.subscriptions.forEach(s => s.unsubscribe());
      
      // Extract org from installation for org-specific data and targets
      const org = this.getOrgFromInstallation(installation);
      
      this.subscriptions = [
        this.seatService.getActivity(installation?.account?.login).subscribe(data => {
          this.activityData = data;
          this.cdr.detectChanges();
        }),
        this.metricsService.getMetrics({
          org: installation?.account?.login,
        }).subscribe(data => {
          this.metricsData = data;
        }),
        this.copilotSurveyService.getAllSurveys({
          org: installation?.account?.login
        }).subscribe(data => {
          this.surveysData = data;
        }),
        // FIXED: Use org-specific targets based on current installation
        this.targetsService.getTargets(org).subscribe(data => {
          this.targetsData = data;
        })
      ];
    });
  }

  /**
   * Extract organization identifier from installation for API calls
   * Returns org name for organization installations, "1" for enterprise-wide, undefined for default
   */
  private getOrgFromInstallation(installation: any): string | undefined {
    if (!installation) {
      // No installation selected - return undefined to use default (enterprise-wide)
      return undefined;
    }
    
    // Check if this is the special "Enterprise" selection (ID = 1)
    // This only appears when there are multiple installations
    if (installation.id === 1) {
      return "1"; // Enterprise-wide targets
    }
    
    // For specific organization installations, use the account login
    if (installation.account?.login && installation.target_type === 'Organization') {
      return installation.account.login;
    }
    
    // Fallback to undefined (will use enterprise-wide on backend)
    return undefined;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  chartChanged(chart: Highcharts.Chart, include = true) {
    if (chart && !this.charts.includes(chart)) {
      const _chart = chart;
      this.charts.push(chart);
      if (include && chart.xAxis && chart.xAxis[0]) {
        chart.xAxis[0].update({
          events: {
            afterSetExtremes: (event) => {
              this.charts
                .filter(otherChart => otherChart !== _chart)
                .forEach(otherChart => {
                  if (otherChart.xAxis?.[0] &&
                    (otherChart.xAxis[0].min !== event.min ||
                      otherChart.xAxis[0].max !== event.max)) {
                    otherChart.xAxis[0].setExtremes(event.min, event.max);
                  }
                });
            }
          }
        });
      }
    }
  }
}
