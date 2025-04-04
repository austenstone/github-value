import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, of, tap } from 'rxjs';
import { serverUrl } from '../server.service';
import { Endpoints } from '@octokit/types';
import { HttpClient } from '@angular/common/http';

export type Installations = Endpoints["GET /app/installations"]["response"]["data"]
export type Installation = Installations[number]

@Injectable({
  providedIn: 'root'
})
export class InstallationsService implements OnDestroy {
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

  refresh() {
    if (!this.installations.value.length) {
      return this.refreshStatus();
    }
    return of(this.installations.value);
  }

  refreshStatus() {
    return this.http.get<any>(`${serverUrl}/api/setup/installations`).pipe(
      tap((installations) => {
        if (installations) {
          this.installations.next(installations);
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
