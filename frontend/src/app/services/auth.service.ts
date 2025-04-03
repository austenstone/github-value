import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { serverUrl } from './server.service';

export interface User {
  id: string;
  username: string;
  displayName?: string;
  photos?: Array<{ value: string }>;
  emails?: Array<{ value: string }>;
  profileUrl?: string;
  provider: 'github';
}

export interface AuthStatus {
  isAuthenticated: boolean;
  user?: User;
  authDisabled?: boolean;
}

export interface SystemAuthStatus {
  authEnabled: boolean;
  isAuthenticated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${serverUrl}/api/auth`;
  private authStatusSubject = new BehaviorSubject<AuthStatus>({ isAuthenticated: false });
  public authStatus$ = this.authStatusSubject.asObservable();
  private authEnabled = true;

  constructor(private http: HttpClient) {
    // Check authentication status on service initialization
    this.checkAuthStatus();
  }

  /**
   * Start GitHub OAuth authentication process
   */
  login(): void {
    // Check if auth is enabled first
    this.getAuthStatus().subscribe(status => {
      if (status.authEnabled) {
        // Redirect to GitHub OAuth entry point
        window.location.href = `${this.apiUrl}/github`;
      } else {
        console.warn('Authentication is disabled. Login functionality is not available.');
      }
    });
  }

  /**
   * Logout the user
   */
  logout(): Observable<any> {
    // If auth is disabled, don't try to logout
    if (!this.authEnabled) {
      return of({ success: false, message: 'Authentication is disabled' });
    }

    return this.http.get(`${this.apiUrl}/logout`).pipe(
      tap(() => {
        // Update authentication status
        this.authStatusSubject.next({ isAuthenticated: false });
      })
    );
  }

  /**
   * Get the server's authentication status
   */
  getAuthStatus(): Observable<SystemAuthStatus> {
    return this.http.get<SystemAuthStatus>(`${this.apiUrl}/status`).pipe(
      tap(status => {
        this.authEnabled = status.authEnabled;
      }),
      catchError(() => {
        return of({ authEnabled: true, isAuthenticated: false });
      })
    );
  }

  /**
   * Check if the user is authenticated
   */
  checkAuthStatus(): void {
    this.http.get<AuthStatus>(`${this.apiUrl}/user`).pipe(
      tap((status) => {
        this.authStatusSubject.next(status);
        // If authDisabled flag is present, store that authentication is disabled
        if (status.authDisabled) {
          this.authEnabled = false;
        }
      }),
      catchError(() => {
        this.authStatusSubject.next({ isAuthenticated: false });
        return of({ isAuthenticated: false });
      })
    ).subscribe();
  }

  /**
   * Get the current authentication status
   */
  isAuthenticated(): boolean {
    return this.authStatusSubject.getValue().isAuthenticated;
  }

  /**
   * Check if authentication is enabled on the server
   */
  isAuthEnabled(): boolean {
    return this.authEnabled;
  }

  /**
   * Get the current authenticated user
   */
  getCurrentUser(): User | undefined {
    return this.authStatusSubject.getValue().user;
  }
}