import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HighchartsChartModule } from 'highcharts-angular';
import { SharedModule } from '../../../shared/shared.module';
import * as Highcharts from 'highcharts';
import { CopilotSurveyService } from '../../../services/api/copilot-survey.service';
import { AdoptionService } from '../../../services/api/adoption.service';
import { MetricsService } from '../../../services/api/metrics.service';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { SettingsHttpService } from '../../../services/api/settings.service';
import { TargetsDetailType, TargetsService, TargetsGridType, initializeGridObject } from '../../../services/api/targets.service';
import { InstallationsService } from '../../../services/api/installations.service';
import { forkJoin, catchError, tap, finalize } from 'rxjs';

@Component({
  selector: 'app-value-modeling',
  standalone: true,
  imports: [
    MaterialModule,
    MatSlideToggleModule,
    CommonModule,
    ReactiveFormsModule,
    HighchartsChartModule,
    SharedModule
  ],
  providers: [
    DecimalPipe
  ],
  encapsulation: ViewEncapsulation.None, // add this line
  templateUrl: './value-modeling.component.html',
  styleUrls: ['./value-modeling.component.scss']
})
export class ValueModelingComponent implements OnInit, AfterViewInit {
  Highcharts: typeof Highcharts = Highcharts;
  // chartOptions: Highcharts.Options;

  private readonly _destroy$ = new Subject<void>();

  gridObject: TargetsGridType = initializeGridObject();
  gridObjectSaved: TargetsGridType = initializeGridObject();
  clickCounter = 0; // when this changes we need to call queryCurrentValues again
  asOfDate: Date = new Date();
  originalAsOfDate: Date = new Date();


  devCostPerYear: number = 0;
  developerCount: number = 0;
  hoursPerYear: number = 1000;
  percentCoding: number = 0;
  percentTimeSaved: number = 0;
  //metricsTotals: CopilotMetrics; // Add this line to declare the metricsTotals property
  installation: any; // Add this line to declare the installation property

  adoptionChartOption: Highcharts.Options = {
    series: [
      {
        name: 'Current',
        type: 'bar',
        data: [this.gridObject.current.seats, this.gridObject.current.adoptedDevs, this.gridObject.current.monthlyDevsReportingTimeSavings, this.gridObject.current.percentSeatsAdopted]
      },
      {
        name: 'Target',
        type: 'bar',
        data: [this.gridObject.target.seats, this.gridObject.target.adoptedDevs, this.gridObject.target.monthlyDevsReportingTimeSavings, this.gridObject.target.percentSeatsAdopted]
      },
      {
        name: 'Max',
        type: 'bar',
        data: [this.gridObject.max.seats, this.gridObject.max.adoptedDevs, this.gridObject.max.monthlyDevsReportingTimeSavings, this.gridObject.max.percentSeatsAdopted]
      }
    ],
    xAxis: {
      categories: ['Seats', 'Adopted Devs', 'Monthly Devs Reporting Time Savings']
    },
    yAxis: {
      title: {
        text: 'Percentage'
      }
    },
    plotOptions: {
      bar: {
        pointPadding: 0.2,
        borderWidth: 0
      }
    },
    legend: {
      enabled: true
    }
  }
  activityChartOptions: Highcharts.Options = {
    series: [
      {
        name: 'Current',
        type: 'bar',
        data: [this.gridObject.current.dailySuggestions, this.gridObject.current.dailyChatTurns, this.gridObject.current.percentSeatsReportingTimeSavings, this.gridObject.current.weeklyTimeSaved]
      },
      {
        name: 'Target',
        type: 'bar',
        data: [this.gridObject.target.dailySuggestions, this.gridObject.target.dailyChatTurns, this.gridObject.target.percentSeatsReportingTimeSavings, this.gridObject.target.weeklyTimeSaved]
      },
      {
        name: 'Max',
        type: 'bar',
        data: [this.gridObject.max.dailySuggestions, this.gridObject.max.dailyChatTurns, this.gridObject.max.percentSeatsReportingTimeSavings, this.gridObject.max.weeklyTimeSaved]
      }
    ],
    xAxis: {
      categories: ['Current', 'Target', 'Max']
    }
  }
  timeSavingsChartOptions: Highcharts.Options = {
    series: [{
      type: 'bar',
      data: []
    }],
    xAxis: {
      categories: ['Current', 'Target', 'Max']
    }
  }
  productivityChartOptions: Highcharts.Options = {
    series: [{
      type: 'bar',
      data: [
        // this.calculateOverallImpact('current'),
        //  this.calculateOverallImpact('target'),
        // this.calculateOverallImpact('max')
      ]
    }],
    xAxis: {
      categories: ['Current', 'Target', 'Max']
    }
  }

  // call the API to get the model data
  //get Count of users with a last activity date in the past 4 weeks(current adopted users)
  //get max Suggestions per daily active user for the past 2/4 weeks (current activity per user)
  //get max chat turns per daily active user for the past 2 weeks (current activity per user)
  //get max Code reviews per daily active user for the past 2 weeks (current activity per user)
  //get 7 day moving average time savings (current time saved)

  // set up the initial model values based on the above and the settings from the API

  form = new FormGroup({
    current: new FormGroup({
      seats: new FormControl('0', [Validators.required, Validators.min(0)]),
      adoptedDevs: new FormControl('0', [Validators.required, Validators.min(0)]),
      monthlyDevsReportingTimeSavings: new FormControl('0', [Validators.required, Validators.min(0)]),
      percentSeatsReportingTimeSavings: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)]),
      percentSeatsAdopted: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)]),
      percentMaxAdopted: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)]),
      dailySuggestions: new FormControl('0', [Validators.required, Validators.min(0)]),
      dailyChatTurns: new FormControl('0', [Validators.required, Validators.min(0)]),
      weeklyPRSummaries: new FormControl('0', [Validators.required, Validators.min(0)]),
      weeklyTimeSaved: new FormControl('0', [Validators.required, Validators.min(0)]),
      monthlyTimeSavings: new FormControl('0', [Validators.required, Validators.min(0)]),
      annualTimeSavingsDollars: new FormControl('0', [Validators.required, Validators.min(0)]),
      productivityBoost: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)]),
      dailyAcceptances: new FormControl('0', [Validators.required, Validators.min(0)]),
      dailyDotComChats: new FormControl('0', [Validators.required, Validators.min(0)]),
      asOfDate: new FormControl('0', [Validators.required, Validators.min(0)])
    }),
    target: new FormGroup({
      seats: new FormControl('0', [Validators.required, Validators.min(0)]),
      adoptedDevs: new FormControl('0', [Validators.required, Validators.min(0)]),
      monthlyDevsReportingTimeSavings: new FormControl('0', [Validators.required, Validators.min(0)]),
      percentSeatsReportingTimeSavings: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)]),
      percentSeatsAdopted: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)]),
      percentMaxAdopted: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)]),
      dailySuggestions: new FormControl('0', [Validators.required, Validators.min(0)]),
      dailyChatTurns: new FormControl('0', [Validators.required, Validators.min(0)]),
      weeklyPRSummaries: new FormControl('0', [Validators.required, Validators.min(0)]),
      weeklyTimeSaved: new FormControl('0', [Validators.required, Validators.min(0)]),
      monthlyTimeSavings: new FormControl('0', [Validators.required, Validators.min(0)]),
      annualTimeSavingsDollars: new FormControl('0', [Validators.required, Validators.min(0)]),
      productivityBoost: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)]),
      dailyAcceptances: new FormControl('0', [Validators.required, Validators.min(0)]),
      dailyDotComChats: new FormControl('0', [Validators.required, Validators.min(0)])
    }),
    max: new FormGroup({
      seats: new FormControl('0', [Validators.required, Validators.min(0)]),
      adoptedDevs: new FormControl('0', [Validators.required, Validators.min(0)]),
      monthlyDevsReportingTimeSavings: new FormControl('0', [Validators.required, Validators.min(0)]),
      percentSeatsReportingTimeSavings: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)]),
      percentSeatsAdopted: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)]),
      percentMaxAdopted: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)]),
      dailySuggestions: new FormControl('0', [Validators.required, Validators.min(0)]),
      dailyChatTurns: new FormControl('0', [Validators.required, Validators.min(0)]),
      weeklyPRSummaries: new FormControl('0', [Validators.required, Validators.min(0)]),
      weeklyTimeSaved: new FormControl('0', [Validators.required, Validators.min(0)]),
      monthlyTimeSavings: new FormControl('0', [Validators.required, Validators.min(0)]),
      annualTimeSavingsDollars: new FormControl('0', [Validators.required, Validators.min(0)]),
      productivityBoost: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)]),
      dailyAcceptances: new FormControl('0', [Validators.required, Validators.min(0)]),
      dailyDotComChats: new FormControl('0', [Validators.required, Validators.min(0)])
    })
  });
  disableInputs: boolean = true;



  constructor(
    private decimalPipe: DecimalPipe,
    private copilotSurveyService: CopilotSurveyService,
    private adoptionService: AdoptionService,
    private settingsService: SettingsHttpService,
    private targetService: TargetsService,
    private installationsService: InstallationsService,
    private metricsService: MetricsService
    //private metricsTotals: CopilotMetrics
  ) { }

  ngOnInit() {
    console.log('Value Modeling Component initialized');


    // Call asynchronous logic
    this.initializeComponent();

    // Subscribe to form value changes
    this.form.valueChanges.subscribe((values) => {
      console.log('1*. Form value changed:', values);
    });

    //this.toggleInputs(); // Call toggleInputs to initialize disabled state
  }

  // Helper method to handle async calls
  private async initializeComponent() {

    this.loadGridObject();
    setTimeout(() => {
      if (this.gridObject.current.asOfDate === 0) {
        this.gridObject.current.asOfDate = new Date().getTime();
        this.asOfDate = new Date();
        this.originalAsOfDate = new Date();
      }
      else {
        this.asOfDate = new Date(this.gridObject.current.asOfDate);
        this.originalAsOfDate = new Date(this.gridObject.current.asOfDate);
      }

    }, 500);

    this.installationsService.currentInstallation.pipe(
      takeUntil(this._destroy$.asObservable())
    ).subscribe(installation => {
      installation?.account?.login;
      try {
        if (installation?.account?.login) {
          this.installation = installation;
          console.log('installation?.account?.login:', installation?.account?.login);
          this.execGridLifecycle();
        }
        console.log('0. Update Current gridObject:', this.gridObject);
      } catch (error) {
        console.error('Error during initialization:', error);
      }
    });
  }


  async execGridLifecycle(): Promise<void> {
    console.log('XXX execGridLifecycle: Executing grid lifecycle');

    try {
      // Step 1: Update current values from API
      await this.queryCurrentAndMaxValues();

      // Step 2: Perform calculations on the updated gridObject
      this.modelCalc();

      await this.queryCurrentAndMaxValues();

      // Step 3: Synchronize the form with gridObject
      this.updateFormFromGridObject();

      // Step 4: refresh the chart 
      Highcharts.charts.forEach(chart => {
        chart?.update({});
      }

      );
      console.log('execGridLifecycle: Lifecycle completed successfully');
    }
    catch (error) {
      console.error('execGridLifecycle: Error encountered', error);
    }

    console.log('GridObject after lifecycle:', this.gridObject);
  }


  ngAfterViewInit() {
    console.log('0. ngAfterViewInit: View initialized');
    this.makeEventListenersPassive();
  }

  private makeEventListenersPassive() {
    const elements = document.querySelectorAll('.highcharts-container');
    elements.forEach(element => {
      element.addEventListener('touchstart', () => { }, { passive: true });
    });
    console.log('-1. makeEventListenersPassive: Event listeners set to passive');
  }

  onBlur(event: Event, level: 'current' | 'target' | 'max', field: keyof TargetsDetailType) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(/,/g, '').replace(/[^0-9.-]+/g, ''));
    this.gridObject[level][field] = isNaN(value) ? 0 : value;
    // console.log(`2. onBlur: Updated gridObject[${level}][${field}] to`, this.gridObject[level][field]);
    this.execGridLifecycle();
    // print out gridObject for debugging
    // console.log('Updated gridObject:', this.gridObject);
  }

  loadGridObject() {
    // Stub: Load the gridObject from a data source

    this.targetService.getTargets().subscribe((targetGrid) => {
      if (targetGrid) {
        this.gridObject = targetGrid;
        console.log('Loaded gridObject:', this.gridObject);
      }
      this.execGridLifecycle();
    });
    // console.log('Loaded gridObject:', this.gridObject);
  }

  saveGridObject() {
    // Stub: Save the gridObject to a data source

    this.updateGridObjectFromForm();
    this.gridObject.current.asOfDate = this.asOfDate.getTime();

    //This needs to be a deep copy. If we do a shallow copy, the gridObjectSaved will be updated whenever the gridObject is updated.
    this.gridObjectSaved = JSON.parse(JSON.stringify(this.gridObject));
    console.log('7. Saved gridObject:', this.gridObjectSaved);
    this.targetService.saveTargets(this.gridObjectSaved).subscribe();
  }

  private updateFormFromGridObject() {
    //console.log('updateFormFromGridObject: Updating form from gridObject');
    this.form.patchValue({
      current: this.convertMetricStateToString(this.gridObject.current),
      target: this.convertMetricStateToString(this.gridObject.target),
      max: this.convertMetricStateToString(this.gridObject.max)
    });
    console.log('6. Updated form values:', this.form.value);
    this.form.markAsTouched();
  }

  private updateGridObjectFromForm() {
    //console.log('updateGridObjectFromForm: Updating gridObject from form');
    const currentFormValue = this.form.get('current')?.value || {};
    const targetFormValue = this.form.get('target')?.value || {};
    const maxFormValue = this.form.get('max')?.value || {};

    this.gridObject.current = this.convertMetricStateToNumber(currentFormValue);
    this.gridObject.target = this.convertMetricStateToNumber(targetFormValue);
    this.gridObject.max = this.convertMetricStateToNumber(maxFormValue);
    // print out gridObject for debugging
    console.log('6. Updated gridObject from form:', this.gridObject);
  }

  convertMetricStateToString(metricState: TargetsDetailType): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    try {
      for (const key in metricState) {
        if (metricState.hasOwnProperty(key) && key !== '_id') {
          if (key === 'asOfDate') {
            result[key] = metricState.asOfDate ? new Date(metricState.asOfDate).toDateString() : '';
          } else if (key === 'productivityBoost') {
            result[key] = this.decimalPipe.transform(metricState[key as keyof TargetsDetailType], '1.0-2') || '0.00';
          } else if (key === 'annualTimeSavingsDollars') {
            console.log(' Raw Value >', metricState[key as keyof TargetsDetailType]);
            result[key] = this.decimalPipe.transform(metricState[key as keyof TargetsDetailType], '1.0-0') || '0';
          } else {
            result[key] = this.decimalPipe.transform(metricState[key as keyof TargetsDetailType], '1.0-0') || '0';
          }
        }
      }
    } catch (error) {
      console.error('Error in convertMetricStateToString:', error);
    }
    return result;
  }

  convertMetricStateToNumber(metricState: { [key: string]: string }): TargetsDetailType {
    const result: TargetsDetailType = {
      seats: 0,
      adoptedDevs: 0,
      monthlyDevsReportingTimeSavings: 0,
      percentSeatsReportingTimeSavings: 0,
      percentSeatsAdopted: 0,
      percentMaxAdopted: 0,
      dailySuggestions: 0,
      dailyAcceptances: 0,
      dailyChatTurns: 0,
      dailyDotComChats: 0,
      weeklyPRSummaries: 0,
      weeklyTimeSaved: 0,
      monthlyTimeSavings: 0,
      annualTimeSavingsDollars: 0,
      productivityBoost: 0,
      asOfDate: 0
    };
    for (const key in metricState) {
      if (metricState.hasOwnProperty(key) && key !== '_id') {
        const value = parseFloat(metricState[key].replace(/,/g, '').replace(/[^0-9.-]+/g, ''));
        result[key as keyof TargetsDetailType] = isNaN(value) ? 0 : value;
      }
    }
    return result;
  }

  modelCalc() {
    try {
      console.log('3. modelCalc: Calculating model');
      // 1. Calculate Max column percentages and then Impacts
      this.gridObject.max.percentSeatsAdopted = this.calculatePercentage(this.gridObject.max.adoptedDevs as number, this.gridObject.max.seats as number);
      this.gridObject.max.percentSeatsReportingTimeSavings = this.calculatePercentage(this.gridObject.max.monthlyDevsReportingTimeSavings as number, this.gridObject.max.seats as number);
      this.gridObject.max.percentMaxAdopted = this.calculatePercentage(this.gridObject.max.adoptedDevs as number, this.gridObject.max.seats as number);
      this.gridObject.max.annualTimeSavingsDollars = this.calculateAnnualTimeSavingsDollars(this.gridObject.max.weeklyTimeSaved as number, this.gridObject.max.adoptedDevs as number);
      this.gridObject.max.monthlyTimeSavings = this.calculateMonthlyTimeSavings(this.gridObject.max.adoptedDevs as number, this.gridObject.max.weeklyTimeSaved as number);
      this.gridObject.max.productivityBoost = this.calculateProductivityBoost(this.gridObject.max.weeklyTimeSaved as number, this.gridObject.max.adoptedDevs as number, this.gridObject.max.seats as number) * 100;

      // 2. Calculate Current column percentages and then Impacts
      this.gridObject.current.percentSeatsAdopted = this.calculatePercentage(this.gridObject.current.adoptedDevs as number, this.gridObject.current.seats as number);
      this.gridObject.current.percentSeatsReportingTimeSavings = this.calculatePercentage(this.gridObject.current.monthlyDevsReportingTimeSavings as number, this.gridObject.current.seats as number);
      this.gridObject.current.percentMaxAdopted = this.calculatePercentage(this.gridObject.current.adoptedDevs as number, this.gridObject.max.seats as number);
      this.gridObject.current.annualTimeSavingsDollars = this.calculateAnnualTimeSavingsDollars(this.gridObject.current.weeklyTimeSaved as number, this.gridObject.current.adoptedDevs as number);
      this.gridObject.current.monthlyTimeSavings = this.calculateMonthlyTimeSavings(this.gridObject.current.adoptedDevs as number, this.gridObject.current.weeklyTimeSaved as number);
      this.gridObject.current.productivityBoost = this.calculateProductivityBoost(this.gridObject.current.weeklyTimeSaved as number, this.gridObject.current.adoptedDevs as number, this.gridObject.max.seats as number) * 100;

      // 3. Calculate Target column values (percentages and then impacts)
      this.gridObject.target.percentSeatsAdopted = this.calculatePercentage(this.gridObject.target.adoptedDevs as number, this.gridObject.target.seats as number);
      this.gridObject.target.percentSeatsReportingTimeSavings = this.calculatePercentage(this.gridObject.target.monthlyDevsReportingTimeSavings as number, this.gridObject.target.seats as number);
      this.gridObject.target.percentMaxAdopted = this.calculatePercentage(this.gridObject.target.adoptedDevs as number, this.gridObject.max.seats as number);
      this.gridObject.target.annualTimeSavingsDollars = this.calculateAnnualTimeSavingsDollars(this.gridObject.target.weeklyTimeSaved as number, this.gridObject.target.adoptedDevs as number);
      this.gridObject.target.monthlyTimeSavings = this.calculateMonthlyTimeSavings(this.gridObject.target.adoptedDevs as number, this.gridObject.target.weeklyTimeSaved as number);
      this.gridObject.target.productivityBoost = this.calculateProductivityBoost(this.gridObject.target.weeklyTimeSaved as number, this.gridObject.target.adoptedDevs as number, this.gridObject.max.seats as number) * 100;

      // 4. Update the form values
      console.log('4. modelCalc: Updated gridObject:', this.gridObject);

    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
      console.error(`5. Error in ModelCalc: ${errorMessage}`);
      alert(`Error in ModelCalc: ${errorMessage}`);
    }
  }

  private calculatePercentage(numerator: number, denominator: number): number {
    if (denominator === 0) {
      return 0;
    }
    return (numerator / denominator) * 100;
  }

  private calculateAnnualTimeSavingsDollars(weeklyTimeSaved: number, adoptedDevs: number): number {
    const weeksInYear = 50;
    const hourlyRate = this.devCostPerYear / (this.hoursPerYear || 1);
    return weeklyTimeSaved * weeksInYear * hourlyRate * adoptedDevs;
  }

  private calculateProductivityBoost(weeklyTimeSaved: number, adoptedDevs: number, maxDevs: number): number {
    console.log('weeklyTimeSaved:', weeklyTimeSaved);
    console.log('adoptedDevs:', adoptedDevs);
    console.log('maxDevs:', maxDevs);
    console.log('this.hoursPerYear:', this.hoursPerYear);
    return weeklyTimeSaved * adoptedDevs * 50 / (this.hoursPerYear * maxDevs) || 1;
  }

  private calculateMonthlyTimeSavings(adoptedDevs: number, weeklyTimeSaved: number): number {
    const weeksInMonth = 4;
    return weeklyTimeSaved * weeksInMonth * adoptedDevs;
  }

  toggleInputs() {

    const controlNames: (keyof TargetsDetailType)[] = [
      'seats', 'adoptedDevs', 'monthlyDevsReportingTimeSavings',
      'percentSeatsReportingTimeSavings', 'percentSeatsAdopted', 'percentMaxAdopted',
      'dailySuggestions', 'dailyChatTurns', 'weeklyPRSummaries', 'weeklyTimeSaved',
      'monthlyTimeSavings', 'annualTimeSavingsDollars', 'productivityBoost'
    ];

    // Iterate through each form control and disable/enable based on disableInputs
    for (const level of ['current', 'target', 'max'] as const) {
      for (const controlName of controlNames) {
        const control = this.form.get(`${level}.${controlName}`);
        if (control) {
          if (this.disableInputs && level !== 'target') {  // Disable current and max when disableInputs is true
            control.disable();
          } else {
            control.enable();
          }
        }
      }
    }
  }


  async queryCurrentAndMaxValues(): Promise<void> {

    const now = new Date();
    const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0);
    const xDaysAgoUTC = new Date(utcNow - this.clickCounter * 24 * 60 * 60 * 1000);
    const xPlus1DaysAgoUTC = new Date(utcNow - (this.clickCounter + .9) * 24 * 60 * 60 * 1000);
    const xPlus7DaysAgoUTC = new Date(utcNow - (this.clickCounter + 6) * 24 * 60 * 60 * 1000);
    const xPlus30DaysAgoUTC = new Date(utcNow - (this.clickCounter + 30) * 24 * 60 * 60 * 1000);
    console.log('xDaysAgo:', xDaysAgoUTC);

    let dayAtaTimeMetricsCounter = 0;
    let weekAtaTimeMetricsCounter = 0;
    let dayAtaTimeAdoptionsCounter = 0; //monthly by default, counting hourly entries
    let weekAtaTimeSurveysCounter = 0;
    let monthAtaTimeSurveysCounter = 0;

    const gridObject = this.gridObject;


    // Combine all service calls using forkJoin for parallel execution
    forkJoin({
      settings: this.settingsService.getAllSettings(),
      dayAtaTimeMetrics: this.metricsService.getMetricsTotals({
        org: this.installation?.account?.login,
        since: xPlus1DaysAgoUTC.toISOString(),
        until: xDaysAgoUTC.toISOString()
      }),
      weekAtaTimeMetrics: this.metricsService.getMetricsTotals({
        org: this.installation?.account?.login,
        since: xPlus7DaysAgoUTC.toISOString(),
        until: xDaysAgoUTC.toISOString()
      }),
      dayAtaTimeAdoptions: this.adoptionService.getAdoptions({
        org: this.installation?.account?.login,
        since: xPlus1DaysAgoUTC.toISOString(),
        until: xDaysAgoUTC.toISOString(),
        daysInactive: 30
      }),
      weekAtaTimeSurveys: this.copilotSurveyService.getAllSurveys({ // org: this.installation?.account?.login, TBD
        since: xPlus7DaysAgoUTC.toISOString(),
        until: xDaysAgoUTC.toISOString()
      }),
      monthAtaTimeSurveys: this.copilotSurveyService.getAllSurveys({ // org: this.installation?.account?.login, TBD
        since: xPlus30DaysAgoUTC.toISOString(),
        until: xDaysAgoUTC.toISOString()
      })
    }).pipe(
      catchError(error => {
        console.error('Service call failed:', error);
        throw error;
      }),
      tap(({ settings }) => {
        // Process settings
        console.log('Settings:', settings);
        this.devCostPerYear = settings.devCostPerYear as number || 0;
        this.developerCount = settings.developerCount as number || 0;
        this.hoursPerYear = settings.hoursPerYear as number || 0;
        this.percentCoding = settings.percentCoding as number || 0;
        this.percentTimeSaved = settings.percentTimeSaved as number || 0;

        // Set max values
        gridObject.max.seats = this.developerCount;
        gridObject.max.adoptedDevs = this.developerCount;
        gridObject.max.monthlyDevsReportingTimeSavings = this.developerCount;
        gridObject.max.dailySuggestions = 150;
        gridObject.max.dailyAcceptances = 50;
        gridObject.max.dailyChatTurns = 50;
        gridObject.max.dailyDotComChats = 50;
        gridObject.max.weeklyPRSummaries = 5;
        gridObject.max.weeklyTimeSaved = (this.hoursPerYear * this.percentCoding / 100 * this.percentTimeSaved / 100) / 50;
      }),
      tap(({ dayAtaTimeAdoptions }) => {
        dayAtaTimeAdoptionsCounter = (dayAtaTimeAdoptions || []).length;
        console.log('Adoption records:', dayAtaTimeAdoptionsCounter);
        // Process adoptions
        for (const adoption of dayAtaTimeAdoptions) {
          //console.log('Adoption data:', adoption.date, adoption.totalActive);
          if (adoption.totalActive > Number(gridObject.current.adoptedDevs || 0) && (gridObject.current.asOfDate != (new Date(adoption.date.$date)).getTime())) {
            gridObject.current.seats = adoption.totalSeats;
            gridObject.current.adoptedDevs = adoption.totalActive;
            gridObject.current.asOfDate = new Date(adoption.date.toString()).getTime();
          }
        }
      }),
      tap(({ dayAtaTimeMetrics }) => {
        dayAtaTimeMetricsCounter = 1
        console.log('Day metrics records:', dayAtaTimeMetricsCounter);
        // Process metrics

        gridObject.current.dailySuggestions = (Number(dayAtaTimeMetrics.copilot_ide_code_completions?.total_code_suggestions) || 0) / (Number(gridObject.current.adoptedDevs) || 1) || 0;
        gridObject.current.dailyAcceptances = (Number(dayAtaTimeMetrics.copilot_ide_code_completions?.total_code_acceptances || 0)) / (Number(gridObject.current.adoptedDevs) || 1) || 0;
        gridObject.current.dailyChatTurns = (Number(dayAtaTimeMetrics.copilot_ide_chat?.total_chats || 0)) / (Number(gridObject.current.adoptedDevs) || 1) || 0;
        gridObject.current.dailyDotComChats = (Number(dayAtaTimeMetrics.copilot_dotcom_chat?.total_chats || 0)) / (Number(gridObject.current.adoptedDevs) || 1) || 0;

      }),
      tap(({ weekAtaTimeMetrics }) => {
        weekAtaTimeMetricsCounter = 1;
        console.log('Week metrics records:', weekAtaTimeMetricsCounter);
        // Process metrics

        gridObject.current.weeklyPRSummaries = (weekAtaTimeMetrics.copilot_dotcom_pull_requests?.total_pr_summaries_created || 0) / (Number(gridObject.current.adoptedDevs) || 1) || 0;
      }),
      tap(({ weekAtaTimeSurveys }) => {
        weekAtaTimeSurveysCounter = (weekAtaTimeSurveys || []).length;
        console.log('Week survey records:', weekAtaTimeSurveysCounter);

        // Get distinct devs who submitted surveys
        const distinctUsers = weekAtaTimeSurveys.reduce((acc, survey) => {
          if (survey.userId && !acc.includes(survey.userId)) {
            acc.push(survey.userId);
          }
          return acc;
        }, [] as string[]);
        console.log('Distinct Devs in week:', distinctUsers.length);

        if (weekAtaTimeSurveys?.length) {
          weekAtaTimeSurveys.forEach(survey => {
            //console.log('Survey pcts:', survey.percentTimeSaved);
          });
          const avgWeeklyTimeSaved = weekAtaTimeSurveys.reduce((acc, survey) =>
            acc + (survey.percentTimeSaved || 0), 0) * 12 * 0.01 / (weekAtaTimeSurveys.length * distinctUsers.length);

          gridObject.current.weeklyTimeSaved = avgWeeklyTimeSaved;  //per developer per week
        }
      }),
      tap(({ monthAtaTimeSurveys }) => {
        monthAtaTimeSurveysCounter = (monthAtaTimeSurveys || []).length;
        console.log('Month survey records:', monthAtaTimeSurveysCounter);
        // Get distinct devs who submitted surveys
        const distinctUsers = monthAtaTimeSurveys.reduce((acc, survey) => {
          if (survey.userId && !acc.includes(survey.userId)) {
            acc.push(survey.userId);
          }
          return acc;
        }, [] as string[]);
        console.log('Distinct Devs in month:', distinctUsers.length);
        gridObject.current.monthlyDevsReportingTimeSavings = distinctUsers.length; // Use distinct users count
      }),
      finalize(() => {
        console.log('Final record counts:', {
          dayMetrics: dayAtaTimeMetricsCounter,
          weekMetrics: weekAtaTimeMetricsCounter,
          adoptions: dayAtaTimeAdoptionsCounter,
          weekSurveys: weekAtaTimeSurveysCounter,
          monthSurveys: monthAtaTimeSurveysCounter
        });
        this.gridObject = gridObject;
        //console.log('601 updateCurrentAndMaxValues: Updated gridObject', gridObject);
      })
    ).subscribe();
  }

  incrementCounter() {
    this.clickCounter++;
    this.asOfDate = new Date(this.originalAsOfDate.getTime() - this.clickCounter * 24 * 60 * 60 * 1000);
    this.execGridLifecycle();
  }

  decrementCounter() {
    this.clickCounter--;
    this.asOfDate = new Date(this.originalAsOfDate.getTime() - this.clickCounter * 24 * 60 * 60 * 1000);
    this.execGridLifecycle();
  }

}
