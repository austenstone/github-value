import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { serverUrl } from '../server.service';

export type ComponentStatus = 'starting' | 'running' | 'error' | 'warning' | 'stopping' | 'stopped';
export type ComponentName = 'database' | 'github' | 'settings' | 'targets' | 'webhooks' | 'tasks';
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
  status: Record<ComponentName, ComponentStatus>;
  componentDetails: Record<ComponentName, ComponentStatusInfo>;
  isReady: boolean;
  uptime: number;
  startTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatusService {
  private apiUrl = `${serverUrl}/api/status`;

  constructor(private http: HttpClient) {}

  refreshStatus(): Observable<SystemStatus> {
    return this.http.get<SystemStatus>(`${this.apiUrl}`).pipe(
      shareReplay(1)
    );
  }

  triggerHealthCheck(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/healthcheck`, {});
  }

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