import { Component, OnDestroy, OnInit } from '@angular/core';
import { InstallationStatus } from '../services/api/setup.service';
import { Router } from '@angular/router';
import { finalize, Subscription, takeWhile, timer } from 'rxjs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InstallationsService } from '../services/api/installations.service';

@Component({
  selector: 'app-db-loading',
  standalone: true,
  imports: [
    MatProgressBarModule
  ],
  template: `
    <div class="loading-container">
      <h2>Database Initialization</h2>
      <mat-progress-bar mode="determinate" [value]="statusProgress"></mat-progress-bar>
      <p class="status-text">{{statusText}}</p>
      <div class="status-details">
        <p [class.completed]="dbStatus.teamsAndMembers">
          <span class="label">Teams & Members</span>
          <span class="status">{{dbStatus.teamsAndMembers ? '✅' : '⏳'}}</span>
        </p>
        <p [class.completed]="dbStatus.copilotSeats">
          <span class="label">Copilot Seats</span>
          <span class="status">{{dbStatus.copilotSeats ? '✅' : '⏳'}}</span>
        </p>
        <p [class.completed]="dbStatus.usage">
          <span class="label">Copilot Usage DB</span>
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
        align-items: center;
        margin: 0.5rem 0;
      }
      
      .label {
        text-align: right;
      }
      
      .status {
        width: 24px;
        text-align: left;
      }
    }

    .completed {
      color: #4CAF50;
    }
  `]
})
export class DbLoadingComponent implements OnInit, OnDestroy {
  private statusSubscription?: Subscription;
  statusText = 'Please wait while we set up your database...';
  statusProgress = 0;
  dbStatus: InstallationStatus = {
    usage: false,
    metrics: false,
    copilotSeats: false,
    teamsAndMembers: false,
    installation: undefined
  };

  constructor(
    private installationsService: InstallationsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.statusSubscription = timer(0, 5000).pipe(
      takeWhile(() => Object.values(this.dbStatus).every(value => value)),
      finalize(() => this.router.navigate(['/']))
    ).subscribe(() => {
      this.installationsService.refreshStatus().subscribe((response) => {
        if (!response.isSetup) {
          this.statusSubscription?.unsubscribe();
          this.router.navigate(['/setup/db']);
          return;
        }

        this.dbStatus = response.installations.reduce((acc, intallation) => {
          acc.usage = acc.usage || intallation.usage;
          acc.metrics = acc.metrics || intallation.metrics;
          acc.copilotSeats = acc.copilotSeats || intallation.copilotSeats;
          acc.teamsAndMembers = acc.teamsAndMembers || intallation.teamsAndMembers;
          return acc;
        }, {
          usage: false,
          metrics: false,
          copilotSeats: false,
          teamsAndMembers: false
        })

        this.updateProgress();
      });
    });
  }

  private updateProgress(): void {
    const completedSteps = Object.values(this.dbStatus).filter(value => value).length;
    this.statusProgress = (completedSteps / 4) * 100;
    this.updateStatusText(completedSteps);
  }

  private updateStatusText(completedSteps: number): void {
    if (completedSteps === 0) {
      this.statusText = 'Starting database initialization...';
    } else if (completedSteps === 4) {
      this.statusText = 'Database initialized successfully! Redirecting...';
    } else {
      this.statusText = `Initialized ${completedSteps} of 4 tables...`;
    }
  }

  ngOnDestroy(): void {
    this.statusSubscription?.unsubscribe()
  }
}
