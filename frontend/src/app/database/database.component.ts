import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { InstallComponent } from '../install/install.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize, takeWhile, timer } from 'rxjs';
import { Installations, InstallationsService } from '../services/api/installations.service';
import { SetupService } from '../services/api/setup.service';
import { StatusService, SystemStatus } from '../services/api/status.service';

@Component({
  selector: 'app-database',
  standalone: true,
  imports: [
    MatButtonModule,
    MatStepperModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    InstallComponent,
    MatProgressSpinnerModule,
    CommonModule
  ],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false },
    },
  ],
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatabaseComponent implements AfterViewInit {
  @ViewChild('stepper') private stepper!: MatStepper;
  status?: SystemStatus;
  installations?: Installations;
  isDbConnecting = false;
  dbFormGroup = new FormGroup({
    uri: new FormControl('', Validators.required)
  });

  constructor(
    private cdr: ChangeDetectorRef,
    private installationService: InstallationsService,
    private statusService: StatusService,
    private router: Router,
    private setupService: SetupService
  ) { }

  ngAfterViewInit() {
    timer(0, 1000).pipe(
      takeWhile(() => !this.status?.isReady),
      finalize(async () => {
        await this.router.navigate(['/copilot'])
      })
    ).subscribe(() => this.checkStatus());
  }

  dbConnect() {
    if(this.dbFormGroup.invalid) return;
    this.isDbConnecting = true;
    this.setupService.setupDB({
      uri: this.dbFormGroup.value.uri!
    }).subscribe(() => {
      this.isDbConnecting = false;
      this.cdr.detectChanges();
      this.checkStatus();
    });
  }

  checkStatus() {
    this.installationService.getInstallations().subscribe(installations => {
      this.installations = installations;
      this.cdr.detectChanges();
    });
    this.statusService.refreshStatus().subscribe(status => {
      this.status = status;
      // Check if database is connected and system is ready
      if (this.status.status.database === 'running' && this.stepper.selectedIndex === 0) {
        const step = this.stepper.steps.get(0);
        if (step) step.completed = true;
        this.stepper.next();
      }
      // Check if GitHub installation is complete
      if (this.status.status.github === 'running' && this.stepper.selectedIndex === 1) {
        const step = this.stepper.steps.get(1);
        if (step) step.completed = true;
        this.stepper.next();
      }
      // Mark the final step as interacted when all conditions are met
      if (this.status.isReady && this.stepper.selectedIndex === 2) {
        const step = this.stepper.steps.get(2);
        if (step) step.interacted = true;
      }
      this.cdr.detectChanges();
    });
  }
}
