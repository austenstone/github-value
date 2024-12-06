import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, of, Subject, tap } from 'rxjs';
import { serverUrl } from '../server.service';
import { Endpoints } from '@octokit/types';
import { HttpClient } from '@angular/common/http';

export interface InstallationStatus {
  installation?: Endpoints["GET /app/installations"]["response"]["data"][number],
  usage: boolean;
  metrics: boolean;
  copilotSeats: boolean;
  teamsAndMembers: boolean;
}
export interface statusResponse {
  isSetup: boolean;
  dbConnected: boolean;
  installations: InstallationStatus[],
}

export type Installations = Endpoints["GET /app/installations"]["response"]["data"]
export type Installation = Installations[number]
@Injectable({
  providedIn: 'root'
})
export class InstallationsService implements OnDestroy {
  private apiUrl = `${serverUrl}/api/setup`;
  status?: statusResponse;
  installations = new BehaviorSubject<Installations>([]);
  currentInstallation = new BehaviorSubject<Installation | undefined>(undefined);
  currentInstallationId = localStorage.getItem('installation') ? parseInt(localStorage.getItem('installation')!) : 0;
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
    return this.http.get<statusResponse>(`${this.apiUrl}/status`).pipe(
      tap((status) => {
        this.status = status;
        if (status.installations) {
          this.installations.next(status.installations.map(i => i.installation!));
          this.setInstallation(this.currentInstallationId);
        }
      })
    );
  }

  getInstallations() {
    return this.installations.asObservable();
  }

  setInstallation(id: number) {
    this.currentInstallationId = id;
    this.currentInstallation.next(this.installations.value.find(i => i.id === id));
    localStorage.setItem('installation', id.toString());
  }

  getStatus2() {
    return this.http.get<any>(`${serverUrl}/api/status`);
  }
  
}
