import { Component, forwardRef } from '@angular/core';
import { AppModule } from '../app.module';
import { FormBuilder, FormGroup, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-copilot-survey',
  standalone: true,
  imports: [
    AppModule
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
export class CopilotSurveyComponent {
  surveyForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.surveyForm = this.fb.group({
      timeSavingPercentage: [30]
    });
  }

  onSubmit() {
    console.log(this.surveyForm.value);
  }
}
