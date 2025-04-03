import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of, tap } from 'rxjs';
import { serverUrl } from '../server.service';
import { Endpoints } from '@octokit/types';
import { HttpClient } from '@angular/common/http';

export interface SystemStatus {
  status: Record<string, 'starting' | 'running' | 'error' | 'warning' | 'stopping' | 'stopped'>;
  componentDetails: Record<string, {
    currentStatus: 'starting' | 'running' | 'error' | 'warning' | 'stopping' | 'stopped';
    lastUpdated: string;
    history: {
      timestamp: string;
      status: 'starting' | 'running' | 'error' | 'warning' | 'stopping' | 'stopped';
      message?: string;
    }[];
    message?: string;
  }>;
  isReady: boolean;
  uptime: number;
  startTime: string;
  seatsHistory?: {
    oldestCreatedAt: string;
    daysSinceOldestCreatedAt?: number;
  };
  installations?: {
    installation: Endpoints["GET /app/installations"]["response"]["data"][0];
    repos: any[];
  }[];
  surveyCount: number;
}

export type Installations = Endpoints["GET /app/installations"]["response"]["data"]
export type Installation = Installations[number]

@Injectable({
  providedIn: 'root'
})
export class InstallationsService implements OnDestroy {
  private apiUrl = `${serverUrl}/api/status`;
  private status?: SystemStatus;
  private installations = new BehaviorSubject<Installations>([]);
  public currentInstallation = new BehaviorSubject<Installation | undefined>(undefined);
  private currentInstallationId = localStorage.getItem('installation') ? parseInt(localStorage.getItem('installation')!) : 0;
  private readonly _destroy$ = new Subject<void>();
  readonly destroy$ = this._destroy$.asObservable();

  constructor(private http: HttpClient) {
    const id = localStorage.getItem('installation');
    if (id) {
      this.setInstallation(Number(id));
    }
  }

  ngOnDestroy(): void {  
    this._destroy$.next();
    this._destroy$.complete();
  }

  getStatus() {
    if (!this.status) {
      return this.refreshStatus();
    }
    return of(this.status);
  }

  refreshStatus() {
    return this.http.get<SystemStatus>(`${this.apiUrl}`).pipe(
      tap((status) => {
        this.status = status;
        if (status.installations) {
          this.installations.next(status.installations.map(i => i.installation));
          if (this.installations.value.length === 1) {
            this.setInstallation(this.installations.value[0].id);
          } else {
            this.setInstallation(this.currentInstallationId);
          }
        }
      })
    );
  }

  getInstallations() {
    return this.installations.asObservable();
  }

  getCurrentInstallation() {
    return this.currentInstallation.asObservable();
  }

  setInstallation(id: number) {
    this.currentInstallationId = id;
    this.currentInstallation.next(this.installations.value.find(i => i.id === id));
    localStorage.setItem('installation', id.toString());
  }
}
