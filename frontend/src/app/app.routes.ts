import { Routes } from '@angular/router';
import { CopilotSurveyComponent } from './copilot-survey/copilot-survey.component';
import { CopilotDashboardComponent } from './copilot-dashboard/copilot-dashboard.component';

export const routes: Routes = [
  { path: '', component: CopilotDashboardComponent },
  { path: 'copilot-survey', component: CopilotSurveyComponent },
  { path: '**', component: CopilotDashboardComponent }
];
