import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HighchartsChartModule } from 'highcharts-angular';
import { SharedModule } from '../../../shared/shared.module';
import * as Highcharts from 'highcharts';
import { GridObject, MetricState, initializeGridObject } from './grid-object.model';

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
  templateUrl: './value-modeling.component.html',
  styleUrl: './value-modeling.component.scss'
})
export class ValueModelingComponent implements OnInit, AfterViewInit {
  Highcharts: typeof Highcharts = Highcharts;
  // chartOptions: Highcharts.Options;
  adoptionChartOption: Highcharts.Options = {
    series: [
      {
        name: 'Current',
        type: 'bar',
        data: []
      },
      {
        name: 'Target',
        type: 'bar',
        data: []
      },
      {
        name: 'Max',
        type: 'bar',
        data: []
      }
    ],
    xAxis: {
      categories: ['Adoption']
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
    series: [{
      type: 'bar',
      data: []
    }],
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
      productivityBoost: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)])
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
      productivityBoost: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)])
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
      productivityBoost: new FormControl('0', [Validators.required, Validators.min(0), Validators.max(100)])
    })
  });

  gridObject: GridObject = initializeGridObject();
  gridObjectSaved: GridObject = initializeGridObject();
  disableInputs = false;

  constructor(
    private decimalPipe: DecimalPipe
  ) {}

  ngOnInit() {
    console.log('Component loaded');
    console.log('ngOnInit: Initializing component');
    console.log('Initial gridObject:', this.gridObject);
    // this.updateChartData();
    // this.form.valueChanges.subscribe(() => this.updateChartData());
    this.form.valueChanges.subscribe((values) => {
      console.log('1*. Form value changed:', values);
      // Example update logic for internal state
    //  this.model.adoption.current = values.current.adoption;
   //   this.model.adoption.target = values.target.adoption;
   //   this.model.adoption.max = values.max.adoption;
      // ...existing code...
    });
  } 

  ngAfterViewInit() {
    console.log('0. ngAfterViewInit: View initialized');
    this.makeEventListenersPassive();
  }

  private makeEventListenersPassive() {
    const elements = document.querySelectorAll('.highcharts-container');
    elements.forEach(element => {
      element.addEventListener('touchstart', () => {}, { passive: true });
    });
    console.log('0. makeEventListenersPassive: Event listeners set to passive');
  }

  onBlur(event: Event, level: 'current' | 'target' | 'max', field: keyof MetricState) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value.replace(/,/g, '').replace(/[^0-9.-]+/g, ''));
    this.gridObject[level][field] = isNaN(value) ? 0 : value;
    console.log(`2. onBlur: Updated gridObject[${level}][${field}] to`, this.gridObject[level][field]);
    this.modelCalc();
    // print out gridObject for debugging
   // console.log('Updated gridObject:', this.gridObject);
  }

  loadGridObject() {
    // Stub: Load the gridObject from a data source
    console.log('loadGridObject: Loading saved gridObject',this.gridObjectSaved);
    this.gridObject = this.gridObjectSaved;
    this.modelCalc();
    //this.updateFormFromGridObject();
    console.log('Loaded gridObject:', this.gridObject);
  }

  saveGridObject() {
    // Stub: Save the gridObject to a data source
   
    this.updateGridObjectFromForm();
    this.modelCalc();
    //This needs to be a deep copy. If we do a shallow copy, the gridObjectSaved will be updated whenever the gridObject is updated.
    this.gridObjectSaved = JSON.parse(JSON.stringify(this.gridObject));
    console.log('7. Saved gridObject:', this.gridObjectSaved);
  }

  private updateFormFromGridObject() {
    //console.log('updateFormFromGridObject: Updating form from gridObject');
    this.form.patchValue({
      current: this.convertMetricStateToString(this.gridObject.current),
      target: this.convertMetricStateToString(this.gridObject.target),
      max: this.convertMetricStateToString(this.gridObject.max)
    });
    console.log('6. Updated form values:', this.form.value);
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

  private convertMetricStateToString(metricState: MetricState): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    for (const key in metricState) {
      if (metricState.hasOwnProperty(key)) {
        result[key] = this.decimalPipe.transform(metricState[key], '1.0-0') || '0';
        console.log('called convertMetricStateToString:', key.toString);
      }
    }
    return result;
  }

  private convertMetricStateToNumber(metricState: { [key: string]: string }): MetricState {
    const result: MetricState = {
      seats: 0,
      adoptedDevs: 0,
      monthlyDevsReportingTimeSavings: 0,
      percentSeatsReportingTimeSavings: 0,
      percentSeatsAdopted: 0,
      percentMaxAdopted: 0,
      dailySuggestions: 0,
      dailyChatTurns: 0,
      weeklyPRSummaries: 0,
      weeklyTimeSaved: 0,
      monthlyTimeSavings: 0,
      annualTimeSavingsDollars: 0,
      productivityBoost: 0
    };
    for (const key in metricState) {
      if (metricState.hasOwnProperty(key)) {
        const value = parseFloat(metricState[key].replace(/,/g, '').replace(/[^0-9.-]+/g, ''));
        result[key as keyof MetricState] = isNaN(value) ? 0 : value;
      }
    }
    return result;
  }

  modelCalc() {
    try {
      console.log('3. modelCalc: Calculating model');
      // 1. Calculate Max column percentages and then Impacts
      this.gridObject.max.percentSeatsAdopted = this.calculatePercentage(this.gridObject.max.adoptedDevs, this.gridObject.max.seats);
      this.gridObject.max.percentSeatsReportingTimeSavings = this.calculatePercentage(this.gridObject.max.monthlyDevsReportingTimeSavings, this.gridObject.max.seats);
      this.gridObject.max.percentMaxAdopted = this.calculatePercentage(this.gridObject.max.adoptedDevs, this.gridObject.max.seats);
      this.gridObject.max.annualTimeSavingsDollars = this.calculateAnnualTimeSavingsDollars(this.gridObject.max.weeklyTimeSaved, this.gridObject.max.adoptedDevs);
      this.gridObject.max.monthlyTimeSavings = this.calculateMonthlyTimeSavings(this.gridObject.max.adoptedDevs, this.gridObject.max.weeklyTimeSaved);
      this.gridObject.max.productivityBoost = this.calculateProductivityBoost(this.gridObject.max.dailySuggestions, this.gridObject.max.dailyChatTurns);

      // 2. Calculate Current column percentages and then Impacts
      this.gridObject.current.percentSeatsAdopted = this.calculatePercentage(this.gridObject.current.adoptedDevs, this.gridObject.current.seats);
      this.gridObject.current.percentSeatsReportingTimeSavings = this.calculatePercentage(this.gridObject.current.monthlyDevsReportingTimeSavings, this.gridObject.current.seats);
      this.gridObject.current.percentMaxAdopted = this.calculatePercentage(this.gridObject.current.adoptedDevs, this.gridObject.current.seats);
      this.gridObject.current.annualTimeSavingsDollars = this.calculateAnnualTimeSavingsDollars(this.gridObject.current.weeklyTimeSaved, this.gridObject.current.adoptedDevs);
      this.gridObject.current.monthlyTimeSavings = this.calculateMonthlyTimeSavings(this.gridObject.current.adoptedDevs, this.gridObject.current.weeklyTimeSaved);
      this.gridObject.current.productivityBoost = this.calculateProductivityBoost(this.gridObject.current.dailySuggestions, this.gridObject.current.dailyChatTurns);

      // 3. Calculate Target column values (percentages and then impacts)
      this.gridObject.target.percentSeatsAdopted = this.calculatePercentage(this.gridObject.target.adoptedDevs, this.gridObject.target.seats);
      this.gridObject.target.percentSeatsReportingTimeSavings = this.calculatePercentage(this.gridObject.target.monthlyDevsReportingTimeSavings, this.gridObject.target.seats);
      this.gridObject.target.percentMaxAdopted = this.calculatePercentage(this.gridObject.target.adoptedDevs, this.gridObject.target.seats);
      this.gridObject.target.annualTimeSavingsDollars = this.calculateAnnualTimeSavingsDollars(this.gridObject.target.weeklyTimeSaved, this.gridObject.target.adoptedDevs);
      this.gridObject.target.monthlyTimeSavings = this.calculateMonthlyTimeSavings(this.gridObject.target.adoptedDevs, this.gridObject.target.weeklyTimeSaved);
      this.gridObject.target.productivityBoost = this.calculateProductivityBoost(this.gridObject.target.dailySuggestions, this.gridObject.target.dailyChatTurns);
// 4. Update the form values
     
      console.log('4. modelCalc: Updated gridObject:', this.gridObject);
      this.updateFormFromGridObject();
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
    const weeksInYear = 50; // TO DO: needs to come from settings
    const hourlyRate = 50; // TO DO: needs to come from settings
    return weeklyTimeSaved * weeksInYear * hourlyRate * adoptedDevs;
  }

  private calculateProductivityBoost(dailySuggestions: number, dailyChatTurns: number): number {
    return dailySuggestions + dailyChatTurns; // Example calculation
  }

  private calculateMonthlyTimeSavings(adoptedDevs: number, weeklyTimeSaved: number): number {
    return adoptedDevs * weeklyTimeSaved * 4;
  }

  toggleInputs(disable: boolean) {
  if (disable) {
    this.disableInputs = true;
  } else {
    this.disableInputs = false;
  }
  console.log('disableInputs:', this.disableInputs);
}
}