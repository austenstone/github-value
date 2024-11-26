import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PredictiveModelingService } from '../../../services/predictive-modeling.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppModule } from '../../../app.module';
import { CommonModule } from '@angular/common';
import { SettingsHttpService } from '../../../services/settings.service';

@Component({
  standalone: true,
  selector: 'app-predictive-modeling',
  templateUrl: './predictive-modeling.component.html',
  styleUrls: ['./predictive-modeling.component.scss'],
  imports: [
    AppModule,
    CommonModule,
  ]
})
export class PredictiveModelingComponent implements OnInit {
  settingsForm = new FormGroup({
    developerCount: new FormControl(0, [Validators.min(0)]),
    devCostPerYear: new FormControl(0, [Validators.min(0)]),
    hoursPerYear: new FormControl(0, [Validators.min(0)]),
    percentCoding: new FormControl(0, [Validators.min(0)]),
    percentTimeSaved: new FormControl(0, [Validators.min(0)]),
    percentDevsAdopting: new FormControl(0, [Validators.min(0)])
  })
  targetForm = new FormGroup({
    targetedRoomForImprovement: new FormControl(0, [Validators.required, Validators.min(0)]),
    targetedNumberOfDevelopers: new FormControl(0, [Validators.required, Validators.min(0)]),
    targetedPercentOfTimeSaved: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(100)]),
  });
  calculatedFields = {
    maxTimeSavings: 0,
    roomForImprovement: 0,
    hoursCodingPerWeek: 0,
    hoursSavedPerWeek: 0,
    maxCopilotUsersActivePerDay: 0,
    copilotUsersActivePerDay: 0
  };

  constructor(
    private predictiveModelingService: PredictiveModelingService,
    private settingsService: SettingsHttpService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadSettings();
    this.loadTargets();
    this.calculateFields();
  }

  loadSettings(): void {
    this.settingsService.getAllSettings().subscribe(settings => {
      this.settingsForm.patchValue({
        developerCount: Number(settings.developerCount),
        devCostPerYear: Number(settings.devCostPerYear),
        hoursPerYear: Number(settings.hoursPerYear),
        percentCoding: Number(settings.percentCoding),
        percentTimeSaved: Number(settings.percentTimeSaved),
        percentDevsAdopting: Number(settings.percentofHoursCoding),
      });
      this.calculateFields();
    });
  }

  loadTargets(): void {
    this.predictiveModelingService.getTargets().subscribe(targets => {
      this.targetForm.patchValue(targets);
    });
  }

  calculateFields(): void {
    const developerCount = this.settingsForm.get('developerCount')?.value || 0;
    const devCostPerYear = this.settingsForm.get('devCostPerYear')?.value || 0;
    const hoursPerYear = this.settingsForm.get('hoursPerYear')?.value || 0;
    const percentCoding = this.settingsForm.get('percentCoding')?.value || 0;
    const percentTimeSaved = this.settingsForm.get('percentTimeSaved')?.value || 0;
    const percentDevsAdopting = this.settingsForm.get('percentDevsAdopting')?.value || 0;

    // Calculate "Max Time Savings"
    // Formula: Developer Count * Dev Hours Per Year * Percent Coding * 0.50
    this.calculatedFields.maxTimeSavings = developerCount * hoursPerYear * (percentCoding / 100) * 0.50;

    // Calculate "Room for Improvement"
    // Formula: Developer Count * Dev Cost Per Year * Percent Coding * 0.50
    const roomForImprovement = developerCount * devCostPerYear * (percentCoding / 100) * 0.50;
    this.calculatedFields.roomForImprovement = roomForImprovement;

    // Calculate "Hours Coding per Week"
    // Formula: 40 * Percent Coding
    this.calculatedFields.hoursCodingPerWeek = 40 * percentCoding / 100;

    // Calculate "Hours Saved per Week"
    // Formula: Percent Time Saved * Hours Coding Per Week
    this.calculatedFields.hoursSavedPerWeek = (percentTimeSaved / 100) * this.calculatedFields.hoursCodingPerWeek;

    // Calculate "Max Number of Copilot Users Active per Day"
    // Formula: Developer Count * 0.75
    this.calculatedFields.maxCopilotUsersActivePerDay = developerCount * (percentDevsAdopting / 100) * 0.75;

    // Calculate "Number of Copilot Users Active per Day"
    // Formula: Developer Count * (Percent Coding / 100)
    this.calculatedFields.copilotUsersActivePerDay = developerCount * (percentDevsAdopting / 100) * (percentCoding / 100);

    // Calculate "Targeted Improvement"
    // Formula: Total Developer count * (Percent of Devs Adopting / 100) * Dev Cost per Year
    const targetedImprovement = developerCount * (percentDevsAdopting / 100) * devCostPerYear;
    this.targetForm.patchValue({ targetedRoomForImprovement: targetedImprovement });

    // Calculate "Targeted Count of Developers"
    // Formula: Total Developer count * (Percent of Devs Adopting / 100)
    const targetedCountOfDevelopers = developerCount * (percentDevsAdopting / 100);
    this.targetForm.patchValue({ targetedNumberOfDevelopers: targetedCountOfDevelopers });

    // Calculate "Dev Hours Saved per Week"
    // Formula: Calculated Field.HoursSavedperWeek
    this.targetForm.patchValue({ targetedPercentOfTimeSaved: this.calculatedFields.hoursSavedPerWeek });
  }

  saveTargets(): void {
    this.settingsService.updateSettings(this.settingsForm.value).subscribe(() => {
      this.snackBar.open('Targets saved successfully', 'Close', {
        duration: 2000,
      });
    });
  }
}
