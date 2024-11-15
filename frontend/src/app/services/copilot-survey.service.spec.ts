import { TestBed } from '@angular/core/testing';
import { CopilotSurveyService } from './copilot-survey.service';

describe('CopilotSurveyService', () => {
  let service: CopilotSurveyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CopilotSurveyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
