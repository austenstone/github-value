import { Component, forwardRef, OnInit } from '@angular/core';
import { AppModule } from '../../../../app.module';
import { FormBuilder, FormControl, FormGroup, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { CopilotSurveyService } from '../../../../services/copilot-survey.service';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-copilot-survey',
  standalone: true,
  imports: [
    AppModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CopilotSurveyComponent),
      multi: true,
    }
  ],
  templateUrl: './copilot-survey.component.html',
  styleUrl: './copilot-survey.component.scss'
})
export class CopilotSurveyComponent implements OnInit {
  surveyForm: FormGroup;
  params: Params = {};
  defaultPercentTimeSaved = 30;

  constructor(
    private fb: FormBuilder,
    private copilotSurveyService: CopilotSurveyService,
    private route: ActivatedRoute
  ) {
    this.surveyForm = this.fb.group({
      usedCopilot: new FormControl(true, Validators.required),
      percentTimeSaved: new FormControl(this.defaultPercentTimeSaved, Validators.required),
      reason: new FormControl(''),
      timeUsedFor: new FormControl('', Validators.required)
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => this.params = params);
    this.surveyForm.get('usedCopilot')?.valueChanges.subscribe((value) => {
      if (!value) {
        this.surveyForm.get('percentTimeSaved')?.setValue(0);
      } else {
        this.surveyForm.get('percentTimeSaved')?.setValue(this.defaultPercentTimeSaved);
      }
    });
  }

  parseGitHubPRUrl(url: string) {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
  
    const owner = pathSegments[1];    const repo = pathSegments[2];    const prNumber = Number(pathSegments[4]);  
    return { owner, repo, prNumber };
  }

  onSubmit() {
    const { owner, repo, prNumber } = this.parseGitHubPRUrl(this.params['url']);
    this.copilotSurveyService.createSurvey({
      dateTime: new Date(),
      userId: this.params['author'],
      owner: owner,
      repo: repo,
      prNumber: prNumber,
      usedCopilot: this.surveyForm.value.usedCopilot,
      percentTimeSaved: Number(this.surveyForm.value.percentTimeSaved),
      reason: this.surveyForm.value.reason,
      timeUsedFor: this.surveyForm.value.timeUsedFor
    }).subscribe(() => {
      const redirectUrl = this.params['url'];
      if (redirectUrl && redirectUrl.startsWith('https://github.com/')) {
        window.location.href = redirectUrl;
      } else {
        console.error('Unauthorized URL:', redirectUrl);
      }
    });
  }

  formatPercent(value: number): string {
    return `${value}%`
  }
}
