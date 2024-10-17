import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CopilotDashboardComponent } from './copilot-dashboard.component';

describe('CopilotDashboardComponent', () => {
  let component: CopilotDashboardComponent;
  let fixture: ComponentFixture<CopilotDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CopilotDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CopilotDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
