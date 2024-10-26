import { Component, OnInit } from '@angular/core';
import { MaterialModule } from '../material.module';
import { AppModule } from '../app.module';
import { FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { SettingsHttpService } from '../services/settings.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
    CommonModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  form = new FormGroup({
    metricsCronExpression: new FormControl('', []),
    baseUrl: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(https?:\/\/)[^\s/$.?#].[^\s]*$/)
    ]),
    webhookProxyUrl: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(https?:\/\/)[^\s/$.?#].[^\s]*$/)
    ]),
    webhookSecret: new FormControl('', [])
  });

  matcher = new MyErrorStateMatcher();

  constructor(
    private settingsService: SettingsHttpService,
    private router: Router
  ) { }

  ngOnInit() {
    this.settingsService.getAllSettings().subscribe((settings) => {
      console.log(settings);
      this.form.setValue({
        metricsCronExpression: settings.metricsCronExpression || '',
        baseUrl: settings.baseUrl || '',
        webhookProxyUrl: settings.webhookProxyUrl || '',
        webhookSecret: settings.webhookSecret || '',
      });
    });
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.settingsService.createSettings(this.form.value).subscribe((response) => {
      this.router.navigate(['/']);
    });
  }
}
