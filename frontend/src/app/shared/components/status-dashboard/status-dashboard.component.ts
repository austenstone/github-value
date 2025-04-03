import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StatusService } from '../../../services/api/status.service.js';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
  status: any;
  loading = true;
  error: string | null = null;
  refreshing = false;
  private refreshInterval = 30000; // 30 seconds
  private subscription: Subscription | null = null;

  constructor(private statusService: StatusService) {}

  ngOnInit(): void {
    this.loadStatus();
    // Set up auto-refresh
    this.subscription = interval(this.refreshInterval)
      .pipe(
        switchMap(() => {
          this.refreshing = true;
          return this.statusService.getStatus();
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
  }

  loadStatus(): void {
    this.loading = true;
    this.statusService.getStatus().subscribe({
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

  refreshStatus(): void {
    this.refreshing = true;
    this.statusService.getStatus().subscribe({
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

  runHealthChecks(): void {
    this.refreshing = true;
    this.statusService.runHealthChecks().subscribe({
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

  getStatusIcon(status: string): string {
    switch (status) {
      case 'running':
        return 'check_circle';
      case 'starting':
        return 'pending';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'stopped':
        return 'stop_circle';
      default:
        return 'help';
    }
  }

  getStatusColor(status: string): string {
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