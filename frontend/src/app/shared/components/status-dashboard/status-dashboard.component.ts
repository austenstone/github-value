import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusService, SystemStatus, ComponentStatus } from '../../../services/api/status.service.js';
import { InstallationsService, Installations } from '../../../services/api/installations.service';
import { interval, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-status-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './status-dashboard.component.html',
  styleUrls: ['./status-dashboard.component.scss']
})
export class StatusDashboardComponent implements OnInit, OnDestroy {
  status: SystemStatus | null = null;
  installations: Installations = [];
  loading = true;
  error: string | null = null;
  refreshing = false;
  private refreshInterval = 30000; // 30 seconds
  private subscription: Subscription | null = null;
  private installationSubscription: Subscription | null = null;

  constructor(
    private statusService: StatusService,
    private installationsService: InstallationsService
  ) {}

  ngOnInit(): void {
    this.loadStatus();
    this.loadInstallations();
    
    // Set up auto-refresh
    this.subscription = interval(this.refreshInterval)
      .pipe(
        switchMap(() => {
          this.refreshing = true;
          return this.statusService.refreshStatus();
        })
      )
      .subscribe({
        next: (data) => {
          this.status = data;
          this.refreshing = false;
          this.error = null;
        },
        error: (err) => {
          console.error('Failed to refresh status:', err);
          this.refreshing = false;
          this.error = 'Failed to refresh status';
        }
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.installationSubscription) {
      this.installationSubscription.unsubscribe();
    }
  }

  loadStatus(): void {
    this.loading = true;
    this.statusService.refreshStatus().subscribe({
      next: (data) => {
        this.status = data;
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        console.error('Failed to load status:', err);
        this.loading = false;
        this.error = 'Failed to load status information';
      }
    });
  }
  
  loadInstallations(): void {
    this.installationSubscription = this.installationsService.refreshStatus().subscribe({
      next: (installations) => {
        this.installations = installations;
      },
      error: (err) => {
        console.error('Failed to load installations:', err);
      }
    });
  }

  refreshStatus(): void {
    this.refreshing = true;
    this.statusService.refreshStatus().subscribe({
      next: (data) => {
        this.status = data;
        this.refreshing = false;
        this.error = null;
        // Also refresh installations when status is refreshed
        this.installationsService.refreshStatus().subscribe({
          next: (installations) => {
            this.installations = installations;
          },
          error: (err) => {
            console.error('Failed to refresh installations:', err);
          }
        });
      },
      error: (err) => {
        console.error('Failed to refresh status:', err);
        this.refreshing = false;
        this.error = 'Failed to refresh status';
      }
    });
  }

  runHealthChecks(): void {
    this.refreshing = true;
    this.statusService.triggerHealthCheck().subscribe({
      next: () => {
        this.refreshStatus();
      },
      error: (err) => {
        console.error('Failed to run health checks:', err);
        this.refreshing = false;
        this.error = 'Failed to run health checks';
      }
    });
  }

  getStatusIcon(status: ComponentStatus): string {
    return this.statusService.getStatusIcon(status);
  }

  getStatusColor(status: ComponentStatus): string {
    switch (status) {
      case 'running':
        return 'green';
      case 'starting':
        return 'blue';
      case 'warning':
        return 'orange';
      case 'error':
        return 'red';
      case 'stopped':
        return 'gray';
      default:
        return 'gray';
    }
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return days > 0 
      ? `${days}d ${hours}h ${minutes}m` 
      : hours > 0 
        ? `${hours}h ${minutes}m ${secs}s` 
        : `${minutes}m ${secs}s`;
  }

  // Helper method to get object keys for template iteration
  objectKeys(obj: Record<string, any>): string[] {
    return Object.keys(obj || {});
  }
}