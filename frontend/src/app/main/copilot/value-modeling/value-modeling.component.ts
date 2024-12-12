import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import { AppModule } from '../../../app.module';

interface MetricState {
  adoption: string;
  usage: {
    activity: string;
    timeSavings: string;
  };
  timeSavedDollars: string;
  downstreamProductivity: string;
}

interface Metrics {
  current: MetricState;
  target: MetricState;
  max: MetricState;
}

@Component({
  selector: 'app-value-modeling',
  standalone: true,
  imports: [
    AppModule,
    MaterialModule,
    CommonModule,
    ReactiveFormsModule,
    HighchartsChartModule,
  ],
  providers: [
    DecimalPipe
  ],
  templateUrl: './value-modeling.component.html',
  styleUrl: './value-modeling.component.scss'
})
export class ValueModelingComponent implements OnInit {
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
        this.calculateOverallImpact('current'),
        this.calculateOverallImpact('target'),
        this.calculateOverallImpact('max')
      ]
    }],
    xAxis: {
      categories: ['Current', 'Target', 'Max']
    }
  }

  // call the API to get the model data
  // get Count of users with a last activity date in the past 4 weeks(current adopted users)
  // get max Suggestions per daily active user for the past 2/4 weeks (current activity per user)
  // get max chat turns per daily active user for the past 2 weeks (current activity per user)
  // get max Code reviews per daily active user for the past 2 weeks (current activity per user)
  // get 7 day moving average time savings (current time saved)

  // set up the initial model values based on the above and the settings from the API
  model = {
    adoption: {
      current: 0, //
      target: 0,
      max: 0
    },
    activity: {
      current: 0,
      target: 0,
      max: 0
    },
    timeSavings: {
      current: 0,
      target: 0,
      max: 0
    },
    timeSavedDollars: {
      current: 0,
      target: 0,
      max: 0
    },
    downstreamProductivity: {
      current: 0,
      target: 0,
      max: 0
    }
  };
  form = new FormGroup({
    current: new FormGroup({
      adoption: new FormControl(20),
      activityLevel: new FormControl(30),
      timeSavings: new FormControl(15),
      timeSavedDollars: new FormControl(50000),
      downstreamProductivity: new FormControl(25)
    }),
    target: new FormGroup({
      adoption: new FormControl(60),
      activityLevel: new FormControl(70),
      timeSavings: new FormControl(45),
      timeSavedDollars: new FormControl(150000),
      downstreamProductivity: new FormControl(75)
    }),
    max: new FormGroup({
      adoption: new FormControl(99),
      activityLevel: new FormControl(99),
      timeSavings: new FormControl(99),
      timeSavedDollars: new FormControl(99),
      downstreamProductivity: new FormControl(99)
    })
  });

  constructor(
    private decimalPipe: DecimalPipe
  ) {}

  ngOnInit() {
  }

  private calculateOverallImpact(level: 'current' | 'target' | 'max'): number {
    const values = this.form?.get(level)?.value;
    if (!values) return 0;

    const usageAvg = (Number(values.activityLevel) + Number(values.timeSavings)) / 2;
    return (Number(values.adoption) * usageAvg * Number(values.downstreamProductivity)) / 10000;
  }
}