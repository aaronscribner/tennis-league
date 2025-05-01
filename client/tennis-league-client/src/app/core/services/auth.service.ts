import { Injectable, inject, signal } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, concatMap, tap, map, switchMap, shareReplay } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth0 = inject(Auth0Service);
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // Use signal pattern for user state
  private userSignal = signal<User | null>(null);
  
  // Public reactive user state with shareReplay to prevent multiple API calls
  public user$ = this.auth0.isAuthenticated$.pipe(
    concatMap(isAuthenticated => {
      if (isAuthenticated) {
        // First get Auth0 profile
        return this.auth0.user$.pipe(
          switchMap(profile => {
            if (profile?.sub) {
              // Then get or create user in our backend
              return this.getUserProfileFromBackend().pipe(
                catchError(() => {
                  // If user doesn't exist in our backend, create it
                  if (profile) {
                    return this.createUserInBackend({
                      auth0Id: profile.sub,
                      email: profile.email,
                      firstName: profile.given_name || profile.name?.split(' ')[0] || '',
                      lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || '',
                    });
                  }
                  return of(null);
                })
              );
            }
            return of(null);
          })
        );
      }
      return of(null);
    }),
    tap(user => {
      this.userSignal.set(user);
    }),
    shareReplay(1)
  );
  
  constructor() {
    // Initialize user$ by subscribing once
    this.user$.subscribe();
  }
  
  // Current user accessor
  get user(): User | null {
    return this.userSignal();
  }
  
  // Get user as an Observable
  getUser(): Observable<User | null> {
    return this.user$;
  }
  
  login(): void {
    this.auth0.loginWithRedirect();
  }
  
  logout(): void {
    this.auth0.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }
  
  isAuthenticated(): Observable<boolean> {
    return this.auth0.isAuthenticated$;
  }
  
  getAccessToken(): Observable<string> {
    return this.auth0.getAccessTokenSilently();
  }
  
  // Get user profile from our backend
  getUserProfileFromBackend(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/profile`);
  }
  
  // Create user in our backend
  createUserInBackend(userData: Partial<User>): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/users`, userData);
  }
  
  // Check if user is a coordinator
  isCoordinator(): Observable<boolean> {
    return this.user$.pipe(
      map(user => user?.role === UserRole.COORDINATOR)
    );
  }
  
  // Keep isAdmin for backward compatibility
  isAdmin(): Observable<boolean> {
    return this.isCoordinator();
  }
}
