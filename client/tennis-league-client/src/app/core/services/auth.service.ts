import { Injectable, inject, signal, effect } from '@angular/core';
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
  
  // Expose user signal publicly for components to consume
  public readonly currentUser = signal<User | null>(null);
  
  // Track if a user creation request is in progress to avoid duplicates
  private creatingUser = false;
  
  // Keep user$ for backward compatibility
  public user$ = this.auth0.isAuthenticated$.pipe(
    concatMap(isAuthenticated => {
      if (isAuthenticated) {
        // First get Auth0 profile
        return this.auth0.user$.pipe(
          switchMap(profile => {
            if (profile?.sub) {
              // Then get or create user in our backend - pass the Auth0 ID
              return this.getUserProfileFromBackend(profile.sub).pipe(
                catchError((err => {
                  console.log('User not found in backend, creating new user', err);
                  // If user doesn't exist in our backend, create it
                  if (profile && !this.creatingUser) {
                    this.creatingUser = true;
                    
                    // Extract Auth0 roles from the token if available
                    const namespace = 'https://api.tennis-league.com';
                    let roles: string[] = [];
                    
                    // Check for roles in the profile metadata
                    if (profile[`${namespace}/roles`] && Array.isArray(profile[`${namespace}/roles`])) {
                      roles = profile[`${namespace}/roles`];
                    }
                    
                    // If no roles found, set default role
                    if (roles.length === 0) {
                      roles = [UserRole.PLAYER];
                    }
                    
                    // Set the primary role based on the roles array
                    const primaryRole = roles.includes(UserRole.COORDINATOR) ? 
                      UserRole.COORDINATOR : UserRole.PLAYER;
                    
                    return this.createUserInBackend({
                      auth0Id: profile.sub,
                      email: profile.email,
                      firstName: profile.given_name || profile.name?.split(' ')[0] || '',
                      lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || '',
                      role: primaryRole,
                      roles: roles
                    }).pipe(
                      tap(() => this.creatingUser = false),
                      catchError(err => {
                        this.creatingUser = false;
                        console.error('Failed to create user:', err);
                        return of(null);
                      })
                    );
                  }
                  return of(null);
                })
              ));
            }
            return of(null);
          })
        );
      }
      return of(null);
    }),
    tap(user => {
      // Update the signal when we get a new user
      this.currentUser.set(user);
    }),
    shareReplay(1)
  );
  
  constructor() {
    // Initialize the signal by subscribing to the user$ observable
    effect(() => {
      // The effect will automatically subscribe to the observable
      // and update when dependencies change
      this.user$.subscribe();
    });
  }
  
  // Current user accessor - keep for backwards compatibility
  get user(): User | null {
    return this.currentUser();
  }
  
  // Get user as an Observable - keep for backwards compatibility
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
  getUserProfileFromBackend(auth0Id?: string): Observable<User> {
    if (auth0Id) {
      console.log('Fetching user profile for Auth0 ID:', auth0Id);
      return this.http.get<User>(`${environment.apiUrl}/users/profile/${auth0Id}`);
    }
    console.log('No Auth0 ID provided, using current user profile endpoint');
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
  
  // Update the current user in the signal
  updateCurrentUser(user: User): void {
    this.currentUser.set(user);
  }
}
