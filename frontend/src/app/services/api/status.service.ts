import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, interval, of } from 'rxjs';
import { catchError, shareReplay, switchMap, tap } from 'rxjs/operators';
import { serverUrl } from '../server.service';

export type ComponentStatus = 'starting' | 'running' | 'error' | 'warning' | 'stopping' | 'stopped';

export interface StatusHistoryEntry {
  timestamp: string;
  status: ComponentStatus;
  message?: string;
}

export interface ComponentStatusInfo {
  currentStatus: ComponentStatus;
  lastUpdated: string;
  history: StatusHistoryEntry[];
  message?: string;
}

export interface SystemStatus {
  status: Record<string, ComponentStatus>;
  componentDetails: Record<string, ComponentStatusInfo>;
  isReady: boolean;
  uptime: number;
  startTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private apiUrl = `${serverUrl}/status`;
  private refreshInterval = 30000; // Default refresh interval in milliseconds
  private refreshTimer: Subscription | null = null;
  private statusSubject = new BehaviorSubject<SystemStatus | null>(null);
  
  // Observable for subscribed components
  systemStatus$ = this.statusSubject.asObservable();
  
  // Observable for auto-refresh (will be subscribed to externally)
  autoRefreshStatus$ = interval(this.refreshInterval).pipe(
    switchMap(() => this.fetchStatus()),
    shareReplay(1)
  );

  constructor(private http: HttpClient) {}

  /**
   * Manually refresh the system status
   */
  refreshStatus(): void {
    this.fetchStatus().subscribe();
  }

  /**
   * Set the auto-refresh interval
   * @param intervalMs Refresh interval in milliseconds
   */
  setRefreshInterval(intervalMs: number): void {
    this.refreshInterval = intervalMs;
    
    // Update the auto-refresh observable
    this.autoRefreshStatus$ = interval(this.refreshInterval).pipe(
      switchMap(() => this.fetchStatus()),
      shareReplay(1)
    );
  }

  /**
   * Get the current system status
   * @returns Observable of SystemStatus
   */
  private fetchStatus(): Observable<SystemStatus | null> {
    return this.http.get<SystemStatus>(`${this.apiUrl}`).pipe(
      tap(status => this.statusSubject.next(status)),
      catchError(error => {
        console.error('Error fetching system status:', error);
        return of(null);
      })
    );
  }

  /**
   * Trigger a health check for all components
   * @returns Observable of health check results
   */
  triggerHealthCheck(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/healthcheck`, {}).pipe(
      tap(result => {
        // Refresh status after health check
        this.refreshStatus();
      }),
      catchError(error => {
        console.error('Error running health check:', error);
        throw error;
      })
    );
  }

  /**
   * Get CSS class for status
   * @param status Component status
   * @returns CSS class for the status
   */
  getStatusClass(status: ComponentStatus): string {
    switch (status) {
      case 'running':
        return 'status-success';
      case 'error':
        return 'status-error';
      case 'warning':
        return 'status-warning';
      case 'starting':
        return 'status-info';
      default:
        return 'status-neutral';
    }
  }

  /**
   * Get icon for status
   * @param status Component status
   * @returns Material icon name for the status
   */
  getStatusIcon(status: ComponentStatus): string {
    switch (status) {
      case 'running':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'starting':
        return 'hourglass_empty';
      case 'stopping':
        return 'power_settings_new';
      case 'stopped':
        return 'cancel';
      default:
        return 'help';
    }
  }
}