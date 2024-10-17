import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopilotSurveyComponent } from './copilot-survey.component';

describe('CopilotSurveyComponent', () => {
  let component: CopilotSurveyComponent;
  let fixture: ComponentFixture<CopilotSurveyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopilotSurveyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CopilotSurveyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
