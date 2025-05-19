import { Injectable, isDevMode } from '@angular/core';
import { CanActivate, GuardResult, MaybeAsync, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { StatusService, SystemStatus } from '../services/api/status.service';

@Injectable({
  providedIn: 'root'
})
export class SetupStatusGuard implements CanActivate {
  responseCache?: SystemStatus;

  constructor(
    private statusService: StatusService,
    private router: Router
  ) {}

  canActivate(): MaybeAsync<GuardResult> {
    if (this.responseCache?.isReady === true) return of(true);
    return this.statusService.refreshStatus().pipe(
      map((response) => {
        console.log('SetupStatusGuard response', response);
        this.responseCache = response;
        if (response.status.database !== 'running') {
          this.router.navigate(['/setup/db']);
          return false;
        }
        if (!response.isReady) {
          this.router.navigate(['/setup/db']);
          return false;
        }
        // if (!response.installations?.some(i => Object.values(i).some(j => !j)) && !isDevMode()) {
        //   this.router.navigate(['/setup/loading']);
        //   return false;
        // }
        return true;
      }),
      catchError((error) => {
        console.log('SetupStatusGuard error', error);
        const serializedError = {
          message: error.message || 'An unknown error occurred',
          code: error.code || 'UNKNOWN',
          status: error.status || 500
        };
        this.router.navigate(['/error'], { state: { error: serializedError } });
        return of(false);
      })
    );
  }

  canActivateChild() {
    return this.canActivate();
  }
}