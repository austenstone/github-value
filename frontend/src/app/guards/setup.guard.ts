import { Injectable, isDevMode } from '@angular/core';
import { CanActivate, GuardResult, MaybeAsync, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { InstallationsService } from '../services/api/installations.service';

@Injectable({
  providedIn: 'root'
})
export class SetupStatusGuard implements CanActivate {
  constructor(
    private installationsService: InstallationsService,
    private router: Router
  ) {}

  canActivate(): MaybeAsync<GuardResult> {
    return this.installationsService.getStatus().pipe(
      map((response) => {
        if (!response.dbConnected) throw new Error('DB not connected');
        if (!response.installations?.some(i => Object.values(i).some(j => !j)) && !isDevMode()) {
          this.router.navigate(['/setup/loading']);
          return false;
        }
        if (!response.isSetup) {
          throw new Error('Not setup');
        }
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/setup/db']);
        return of(false);
      })
    );
  }

  canActivateChild() {
    return this.canActivate();
  }
}