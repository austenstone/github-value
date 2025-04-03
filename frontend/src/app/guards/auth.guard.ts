import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, CanMatch, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanMatch {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.checkAuth();
  }

  canActivateChild(): Observable<boolean | UrlTree> {
    return this.checkAuth();
  }

  canMatch(): Observable<boolean | UrlTree> {
    return this.checkAuth();
  }

  private checkAuth(): Observable<boolean | UrlTree> {
    return this.authService.authStatus$.pipe(
      take(1),
      map(status => {
        // If authentication is disabled or user is authenticated, allow access
        if (status.authDisabled || status.isAuthenticated) {
          return true;
        }
        
        // Store the attempted URL for redirecting after login
        // Redirect to login page
        return this.router.createUrlTree(['/login']);
      })
    );
  }
}