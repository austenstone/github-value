import { Component, forwardRef, OnInit } from '@angular/core';
import { AppModule } from '../../../../app.module';
import { AbstractControl, FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR, ValidationErrors, Validators } from '@angular/forms';
import { CopilotSurveyService, Survey } from '../../../../services/api/copilot-survey.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MembersService } from '../../../../services/api/members.service';
import { InstallationsService } from '../../../../services/api/installations.service';
import { catchError, map, Observable, of } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';

export function userIdValidator(membersService: MembersService) {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    return membersService.getMemberByLogin(control.value).pipe(
      map(isValid => (isValid ? null : { invalidUserId: true })),
      catchError(() => of({ invalidUserId: true }))
    );
  };
}

@Component({
  selector: 'app-copilot-survey',
  standalone: true,
  imports: [
    AppModule,
    MatTooltipModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NewCopilotSurveyComponent),
      multi: true,
    }
  ],
  templateUrl: './new-copilot-survey.component.html',
  styleUrl: './new-copilot-survey.component.scss'
})
export class NewCopilotSurveyComponent implements OnInit {
  surveyForm: FormGroup;
  params: Params = {};
  defaultPercentTimeSaved = 25;
  id: number;
  surveys: Survey[] = [];
  orgFromApp: string = '';

  constructor(
    private fb: FormBuilder,
    private copilotSurveyService: CopilotSurveyService,
    private route: ActivatedRoute,
    private router: Router,
    private membersService: MembersService,
    private installationsService: InstallationsService
  ) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.id = isNaN(id) ? 0 : id;
    this.surveyForm = this.fb.group({
      userId: new FormControl('', {
        validators: Validators.required,
        asyncValidators: userIdValidator(this.membersService),
      }),
      repo: new FormControl(''),
      prNumber: new FormControl(''),
      usedCopilot: new FormControl(true, Validators.required),
      percentTimeSaved: new FormControl(this.defaultPercentTimeSaved, Validators.required),
      reason: new FormControl(''),
      timeUsedFor: new FormControl('', Validators.required)
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.params = params;
      this.surveyForm.get('userId')?.setValue(params['author']);
    });

    // Subscribe to the installationsService to get the latest organization
    this.installationsService.currentInstallation.subscribe(installation => {
      this.orgFromApp = installation?.account?.login || '';
    });

    this.loadHistoricalReasons();

    this.surveyForm.get('usedCopilot')?.valueChanges.subscribe((value) => {
      if (!value) {
        this.surveyForm.get('percentTimeSaved')?.setValue(0);
      } else {
        this.surveyForm.get('percentTimeSaved')?.setValue(this.defaultPercentTimeSaved);
      }
    });
  }

  loadHistoricalReasons() {
    this.copilotSurveyService.getAllSurveys({
      reasonLength: 20,
      org: this.orgFromApp
    }).subscribe((surveys: Survey[]) => {
      this.surveys = surveys;
    }
    );
  }

  addKudos(survey: Survey) {
    if (survey && survey.id) {
      this.copilotSurveyService.updateSurvey({
        id: survey.id,
        kudos: survey.kudos ? survey.kudos + 1 : 1
      }).subscribe(() => {
        survey.kudos = (survey.kudos || 0) + 1;
      });
    }
  }

  parseGitHubPRUrl(url: string) {
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch {
      return { org: '', repo: '', prNumber: NaN };
    }
    const pathSegments = urlObj.pathname.split('/');

    const org = pathSegments[1];
    const repo = pathSegments[2];
    const prNumber = Number(pathSegments[4]);
    return { org, repo, prNumber };
  }

  onSubmit() {
    const { org, repo, prNumber } = this.parseGitHubPRUrl(this.params['url']);
    const survey = {
      id: this.id,
      userId: this.surveyForm.value.userId,
      org: org || this.orgFromApp,
      repo: repo || this.surveyForm.value.repo,
      prNumber: prNumber || this.surveyForm.value.prNumber,
      usedCopilot: this.surveyForm.value.usedCopilot,
      percentTimeSaved: Number(this.surveyForm.value.percentTimeSaved),
      reason: this.surveyForm.value.reason,
      timeUsedFor: this.surveyForm.value.timeUsedFor
    };
    if (!this.id) {
      this.copilotSurveyService.createSurvey(survey).subscribe(() => {
        this.router.navigate(['/copilot/survey']);
      });
    } else {
      this.copilotSurveyService.createSurveyGitHub(survey).subscribe(() => {
        const redirectUrl = this.params['url'];
        if (redirectUrl && redirectUrl.startsWith('https://github.com/')) {
          window.location.href = redirectUrl;
        } else {
          console.error('Unauthorized URL:', redirectUrl);
        }
      });
    }
  }

  formatPercent(value: number) {
    return `${value}%`
  }
}
