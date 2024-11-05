import { Routes } from '@angular/router';
import { CopilotSurveyComponent } from './surveys/copilot-survey/copilot-survey.component';
import { CopilotDashboardComponent } from './copilot-dashboard/copilot-dashboard.component';
import { SurveysComponent } from './surveys/surveys.component';
import { SettingsComponent } from './settings/settings.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { SetupGuard } from './guards/setup.guard';
import { MainComponent } from './main/main.component';

export const routes: Routes = [
  { path: 'setup', component: WelcomeComponent }, // Not guarded
  {
    path: '',
    component: MainComponent,
    canActivate: [SetupGuard],
    canActivateChild: [SetupGuard],
    children: [
      { path: 'surveys/new', component: CopilotSurveyComponent },
      { path: 'surveys', component: SurveysComponent },
      { path: 'settings', component: SettingsComponent }
    ]
  },
  { path: '**', component: MainComponent }
];