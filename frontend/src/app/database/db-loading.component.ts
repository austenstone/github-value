import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { InstallationsService } from '../services/api/installations.service';
import { Subscription } from 'rxjs';
import { StatusService, SystemStatus } from '../services/api/status.service';

@Component({
  selector: 'app-db-loading',
  standalone: true,
  imports: [
    MatProgressBarModule,
  ],
  template: `
    <div class="loading-container">
      <h2>Loading Data</h2>
      <mat-progress-bar mode="determinate" [value]="statusProgress"></mat-progress-bar>
      <div class="status-text">{{statusText}}</div>
      <div class="status-details">
        <p [class.completed]="dbStatus.teamsAndMembers">
          <span class="label">Teams & Members</span>
          <span class="status">{{dbStatus.teamsAndMembers ? '✅' : '⏳'}}</span>
        </p>
        <p [class.completed]="dbStatus.usage">
          <span class="label">Usage</span>
          <span class="status">{{dbStatus.usage ? '✅' : '⏳'}}</span>
        </p>
        <p [class.completed]="dbStatus.metrics">
          <span class="label">CopilotMetrics</span>
          <span class="status">{{dbStatus.metrics ? '✅' : '⏳'}}</span>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      max-width: 450px;
      margin: 0 auto;
      text-align: center;
    }

    h2 {
      margin-bottom: 2rem;
    }

    mat-progress-bar {
      width: 100%;
      height: 6px;
    }

    .status-text {
      margin-top: 1rem;
    }

    .status-details {
      margin-top: 1.5rem;
      
      p {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 1rem;
        margin: 0.5rem 0;
        opacity: 0.7;
        font-size: 0.9rem;

        &.completed {
          opacity: 1;
        }
      }

      .label {
        text-align: right;
      }
    }
  `]
})
export class DbLoadingComponent implements OnInit, OnDestroy {
  private statusSubscription?: Subscription;
  statusProgress = 0;
  statusText = 'Initializing...';
  dbStatus = {
    usage: false,
    metrics: false,
    copilotSeats: false,
    teamsAndMembers: false
  };

  constructor(
    private router: Router,
    private statusService: StatusService
  ) {}

  ngOnInit() {
    this.pollStatus();
  }

  ngOnDestroy() {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }

  private pollStatus() {
    const interval = setInterval(() => {
      this.statusSubscription = this.statusService.refreshStatus().subscribe((status: SystemStatus) => {
        if (!status.componentDetails['database']?.currentStatus || status.componentDetails['database'].currentStatus === 'error') {
          clearInterval(interval);
          this.statusSubscription?.unsubscribe();
          this.router.navigate(['/setup/db']);
          return;
        }

        // Check initialization components
        // this.dbStatus = {
        //   usage: status.componentDetails['usage']?.currentStatus === 'running',
        //   metrics: status.componentDetails['metrics']?.currentStatus === 'running',
        //   copilotSeats: status.componentDetails['seats']?.currentStatus === 'running',
        //   teamsAndMembers: status.componentDetails['teams']?.currentStatus === 'running'
        // };

        this.updateProgress();

        // If everything is initialized, navigate to home
        if (Object.values(this.dbStatus).every(value => value)) {
          clearInterval(interval);
          this.statusSubscription?.unsubscribe();
          this.router.navigate(['/']);
        }
      });
    }, 2000);
  }

  private updateProgress(): void {
    const completedSteps = Object.values(this.dbStatus).filter(value => value).length;
    this.statusProgress = (completedSteps / 4) * 100;
    this.updateStatusText(completedSteps);
  }

  private updateStatusText(completed: number): void {
    const remaining = 4 - completed;
    this.statusText = remaining === 0 ? 
      'Data loading complete!' : 
      `Loading data... ${completed}/4 complete`;
  }
}
