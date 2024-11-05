import { Component } from '@angular/core';
import { MaterialModule } from '../material.module';
import { AppModule } from '../app.module';
import { CopilotSurveyService as CopilotSurveyService } from '../services/copilot-survery.service';
import { Survey } from '../models/survey';
import { ColumnOptions } from '../table/table.component';

@Component({
  selector: 'app-surveys',
  standalone: true,
  imports: [
    AppModule,
    MaterialModule
  ],
  templateUrl: './surveys.component.html',
  styleUrl: './surveys.component.scss'
})
export class SurveysComponent {
  surveys?: Survey[];
  surveysColumns: ColumnOptions[] = [
    { columnDef: 'id', header: 'ID', cell: (element: Survey) => `${element.id}` },
    { columnDef: 'userId', header: 'Author', cell: (element: Survey) => `${element.userId}`, link: (element: Survey) => `https://github.com/${element.userId}` },
    { columnDef: 'usedCopilot', header: 'Used Copilot', cell: (element: Survey) => `${element.usedCopilot}` },
    { columnDef: 'percentTimeSaved', header: 'Time Saved', cell: (element: Survey) => `${element.percentTimeSaved}%` },
    { columnDef: 'timeUsedFor', header: 'Time Used For', cell: (element: Survey) => this.formatTimeUsedFor(element.timeUsedFor) },
    // { columnDef: 'owner', header: 'Owner', cell: (element: Survey) => `${element.owner}` },
    // { columnDef: 'repo', header: 'Repo', cell: (element: Survey) => `${element.repo}` },
    { columnDef: 'prNumber', header: 'PR', cell: (element: Survey) => `${element.repo}#${element.prNumber}`, link: (element: Survey) => `https://github.com/${element.owner}/${element.repo}/pull/${element.prNumber}` },
    { columnDef: 'dateTime', header: 'Date Time', cell: (element: Survey) => new Date(element.dateTime).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'}) },
    { columnDef: 'reason', header: 'Reason', cell: (element: Survey) => element.reason || '-' },
    // { columnDef: 'createdAt', header: 'Created At', cell: (element: Survey) => `${element.createdAt}` },
    // { columnDef: 'updatedAt', header: 'Updated At', cell: (element: Survey) => `${element.updatedAt}` },
  ];

  constructor(
    private copilotSurveyService: CopilotSurveyService
  ) { }

  ngOnInit() {
    this.copilotSurveyService.getAllSurveys().subscribe((surveys) => {
      console.log(surveys);
      this.surveys = surveys;
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
          default:
              return 'Unknown';
      }
  }
}
