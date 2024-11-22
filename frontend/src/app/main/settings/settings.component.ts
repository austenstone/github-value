import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { AppModule } from '../../app.module';
import { AbstractControl, FormControl, FormGroup, FormGroupDirective, NgForm, ValidationErrors, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { SettingsHttpService } from '../../services/settings.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SetupService } from '../../services/setup.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ThemeService } from '../../services/theme.service';
import { Endpoints } from '@octokit/types';
import cronstrue from 'cronstrue';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MaterialModule,
    AppModule,
    CommonModule,
    MatCheckboxModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  form = new FormGroup({
    developerCount: new FormControl('', [
      Validators.min(1)
    ]),
    copilotLicenseCount: new FormControl('', [
      Validators.min(0)
    ]),
    percentDevsAdopted: new FormControl('', [
      Validators.min(0),
      Validators.max(100)
    ]),
    devCostPerYear: new FormControl('', [
      Validators.min(0)
    ]),
    hoursPerYear: new FormControl('2080', [
      Validators.min(1),
      Validators.max(8760)
    ]),
    percentCoding: new FormControl('', [
      Validators.min(0),
      Validators.max(100)
    ]),
    percentTimeSaved: new FormControl('', [
      Validators.min(0),
      Validators.max(100)
    ]),
    metricsCronExpression: new FormControl('', [
      (control: AbstractControl): ValidationErrors | null => {
        try {
          this.cronString = cronstrue.toString(control.value, {
            throwExceptionOnParseError: true,
            verbose: true
          });
          if (!this.cronString) throw new Error('Invalid cron expression');
        } catch (error) {
          return { invalidCron: { value: error } };
        }
        return null
      },
    ]),
    baseUrl: new FormControl('', [
      Validators.pattern(/^(https?:\/\/)[^\s/$.?#].[^\s]*$/)
    ]),
    webhookProxyUrl: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(https?:\/\/)[^\s/$.?#].[^\s]*$/)
    ]),
    webhookSecret: new FormControl('', [])
  });
  cronString = '';
  install?: Endpoints["GET /app"]["response"]['data'];

  constructor(
    private settingsService: SettingsHttpService,
    private router: Router,
    private setupService: SetupService,
    public themeService: ThemeService
  ) { }

  ngOnInit() {
    this.settingsService.getAllSettings().subscribe((settings) => {
      this.form.setValue({
        metricsCronExpression: settings.metricsCronExpression || '',
        baseUrl: settings.baseUrl || '',
        webhookProxyUrl: settings.webhookProxyUrl || '',
        webhookSecret: settings.webhookSecret || '',
        devCostPerYear: settings.devCostPerYear || '',
        developerCount: settings.developerCount || '',
        copilotLicenseCount: settings.copilotLicenseCount || '',
        percentDevsAdopted: settings.percentDevsAdopted || '',
        hoursPerYear: settings.hoursPerYear || '',
        percentCoding: settings.percentCoding || '',
        percentTimeSaved: settings.percentTimeSaved || ''
      });
    });

    this.setupService.getInstall().subscribe((install) => {
      this.install = install;
    });
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.settingsService.createSettings(this.form.value).subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
