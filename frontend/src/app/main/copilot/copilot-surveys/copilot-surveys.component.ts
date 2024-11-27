import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { AppModule } from '../../../app.module';
import { CopilotSurveyService, Survey } from '../../../services/api/copilot-survey.service';
import { ColumnOptions } from '../../../shared/table/table.component';
import { Router } from '@angular/router';
import { InstallationsService } from '../../../services/api/installations.service';
import { takeUntil } from 'rxjs';

@Component({
  selector: 'app-copilot-surveys',
  standalone: true,
  imports: [
    AppModule,
    MaterialModule
  ],
  templateUrl: './copilot-surveys.component.html',
  styleUrl: './copilot-surveys.component.scss'
})
export class CopilotSurveysComponent implements OnInit {
  surveys?: Survey[];
  surveysColumns: ColumnOptions[] = [
    { columnDef: 'id', header: 'ID', cell: (element: Survey) => `${element.id}` },
    { columnDef: 'userId', header: 'Author', cell: (element: Survey) => `${element.userId}`, link: (element: Survey) => `https://github.com/${element.userId}` },
    { columnDef: 'usedCopilot', header: 'Used Copilot', cell: (element: Survey) => element.status === 'pending' ? 'more_horiz' : element.usedCopilot ? 'svg:github-copilot' : 'close', isIcon: true, iconColor: () => 'var(--sys-on-surface)' },
    { columnDef: 'percentTimeSaved', header: 'Time Saved', cell: (element: Survey) => element.percentTimeSaved < 0 ? '-' : `${element.percentTimeSaved}%` },
    { columnDef: 'timeUsedFor', header: 'Time Used For', cell: (element: Survey) => this.formatTimeUsedFor(element.timeUsedFor) },
    { columnDef: 'prNumber', header: 'PR', cell: (element: Survey) => `${element.repo}#${element.prNumber}`, link: (element: Survey) => `https://github.com/${element.org}/${element.repo}/pull/${element.prNumber}` },
    { columnDef: 'createdAt', header: 'Updated', cell: (element: Survey) => new Date(element.updatedAt!).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) },
    { columnDef: 'status', header: 'Status', cell: (element: Survey) => `${element.status}`, chipList: true, chipListIcon: (el: Survey) => el.status === 'pending' ? 'pending' : el.status === 'completed' ? 'check' : 'close' },
    // { columnDef: 'reason', header: 'Reason', cell: (element: Survey) => element.reason || '-' },
  ];

  constructor(
    private copilotSurveyService: CopilotSurveyService,
    private router: Router,
    private installationsService: InstallationsService
  ) { }

  ngOnInit() {
    this.installationsService.currentInstallation.pipe(
      takeUntil(this.installationsService.destroy$)
    ).subscribe(installation => {
      this.copilotSurveyService.getAllSurveys(installation?.account?.login).subscribe((surveys) => {
        this.surveys = surveys;
      });
    });
  }

  formatTimeUsedFor(s: string) {
    switch (s) {
      case 'fasterPRs':
        return "Faster PRs";
      case 'fasterReleases':
        return 'Faster Releases';
      case 'repoHousekeeping':
        return 'Housekeeping';
      case 'techDebt':
        return 'Tech Debt';
      case 'experimentLearn':
        return 'Experiment or Learn';
      case 'other':
        return 'Other';
      case '':
        return '-';
      default:
        return 'Unknown';
    }
  }

  onSurveyClick(survey: Survey) {
    this.router.navigate(['/copilot/surveys', survey.id]);
  }
}
