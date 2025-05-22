import { Injectable } from '@angular/core';
import { CanActivate, GuardResult, MaybeAsync, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { InstallationsService, statusResponse } from '../services/api/installations.service';

@Injectable({
  providedIn: 'root'
})
export class SetupStatusGuard implements CanActivate {
  responseCache?: statusResponse;

  constructor(
    private installationsService: InstallationsService,
    private router: Router
  ) {}

  canActivate(): MaybeAsync<GuardResult> {
    if (this.responseCache?.isSetup === true) return of(true);
    return this.installationsService.refreshStatus().pipe(
      map((response) => {
        this.responseCache = response;
        if (!response.dbConnected) {
          this.router.navigate(['/setup/db']);
          return false;
        }
        if (!response.isSetup) {
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