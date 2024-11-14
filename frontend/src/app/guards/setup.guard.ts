import { Injectable, isDevMode } from '@angular/core';
import { CanActivate, CanActivateChild, GuardResult, MaybeAsync, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SetupService, SetupStausResponse } from '../services/setup.service';

@Injectable({
  providedIn: 'root'
})
export class SetupGuard implements CanActivate, CanActivateChild {
  cache: SetupStausResponse = {
    isSetup: false,
    dbInitialized: false
  };

  constructor(
    private setupService: SetupService,
    private router: Router
  ) { }

  canActivate(): MaybeAsync<GuardResult> {
    if (this.cache.isSetup && this.cache.dbInitialized) {
      return of(true);
    }
    return this.setupService.getSetupStatus(['isSetup', 'dbInitialized']).pipe(
      map((response) => {
        this.cache = response;
        if (!response.isSetup) {
          this.router.navigate(['/setup'])
          return false;
        }
        if (!response.dbInitialized && !isDevMode()) {
          this.router.navigate(['/setup/loading']);
          return false;
        }
        return true;
      }),
      catchError(() => {
        this.router.navigate(['/setup']);
        return of(false);
      })
    );
  }

  canActivateChild(): MaybeAsync<GuardResult> {
    return this.canActivate();
  }
}
