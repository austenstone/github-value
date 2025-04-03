import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { Observable, Subject, Subscription, interval } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';

import { ComponentStatus, ComponentStatusInfo, StatusService, SystemStatus } from '../../services/api/status.service';

@Component({
  selector: 'app-status-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './status-dashboard.component.html',
  styleUrls: ['./status-dashboard.component.scss']
})
export class StatusDashboardComponent implements OnInit, OnDestroy {
  systemStatus$: Observable<SystemStatus | null>;
  autoRefreshSubscription: Subscription | null = null;
  loading = true;
  private destroy$ = new Subject<void>();
  objectKeys = Object.keys;

  constructor(
    public statusService: StatusService,
    private snackBar: MatSnackBar
  ) {
    this.systemStatus$ = this.statusService.systemStatus$.pipe(
      filter(status => status !== null)
    );
  }

  ngOnInit(): void {
    // Start auto-refresh
    this.enableAutoRefresh();
    
    // Initial data load
    this.loading = true;
    this.statusService.refreshStatus();
    this.systemStatus$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loading = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disableAutoRefresh();
  }

  /**
   * Enable auto-refresh of status data
   */
  enableAutoRefresh(intervalMs: number = 30000): void {
    this.disableAutoRefresh(); // Clean up any existing subscription
    
    this.autoRefreshSubscription = this.statusService.autoRefreshStatus$.pipe(
      takeUntil(this.destroy$)
    ).subscribe();
    
    this.statusService.setRefreshInterval(intervalMs);
  }

  /**
   * Disable auto-refresh of status data
   */
  disableAutoRefresh(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
      this.autoRefreshSubscription = null;
    }
  }

  /**
   * Refresh status data manually
   */
  refreshStatus(): void {
    this.loading = true;
    this.statusService.refreshStatus();
    
    // Show a notification
    this.snackBar.open('Refreshing status information...', 'Close', {
      duration: 2000
    });
  }

  /**
   * Run a health check on all components
   */
  runHealthCheck(): void {
    this.loading = true;
    this.statusService.triggerHealthCheck().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.loading = false;
        this.snackBar.open('Health check completed', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Health check failed: ' + error.message, 'Close', {
          duration: 5000
        });
      }
    });
  }

  /**
   * Get a human-readable uptime from seconds
   */
  formatUptime(seconds: number): string {
    if (!seconds) return 'Unknown';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0 || days > 0) result += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m `;
    result += `${secs}s`;
    
    return result;
  }

  /**
   * Format a date for display
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return 'Unknown';
    
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  /**
   * Get status class for component
   */
  getStatusClass(status: ComponentStatus): string {
    return this.statusService.getStatusClass(status);
  }

  /**
   * Get icon for component status
   */
  getStatusIcon(status: ComponentStatus): string {
    return this.statusService.getStatusIcon(status);
  }

  /**
   * Returns percentage value based on how many components are in a running state
   */
  getSystemHealthPercentage(status: SystemStatus): number {
    if (!status?.status) return 0;
    
    const componentCount = Object.keys(status.status).length;
    if (componentCount === 0) return 0;
    
    const runningCount = Object.values(status.status)
      .filter(s => s === 'running')
      .length;
    
    return Math.round((runningCount / componentCount) * 100);
  }
}