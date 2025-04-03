import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCardLineChartComponent } from './dashboard-card-line-chart.component';

describe('DashboardCardLineChartComponent', () => {
  let component: DashboardCardLineChartComponent;
  let fixture: ComponentFixture<DashboardCardLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCardLineChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCardLineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
