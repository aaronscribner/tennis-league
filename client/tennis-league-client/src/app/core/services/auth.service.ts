import { Injectable } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, concatMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/users`;
  private user: User | null = null;

  constructor(
    private auth0: Auth0Service,
    private http: HttpClient
  ) {}

  // Log in with Auth0
  login(): void {
    this.auth0.loginWithRedirect();
  }

  // Log out
  logout(): void {
    this.auth0.logout({ 
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }

  // Get the authenticated user from our API
  getUser(): Observable<User | null> {
    // If we already have the user, return it
    if (this.user) {
      return of(this.user);
    }

    // Otherwise, get it from API
    return this.auth0.user$.pipe(
      concatMap(auth0User => {
        if (!auth0User) {
          return of(null);
        }

        // Try to get existing user from API
        return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
          catchError(err => {
            // If user doesn't exist in our database, create one
            if (err.status === 404) {
              const newUser: Partial<User> = {
                firstName: auth0User.given_name || '',
                lastName: auth0User.family_name || '',
                email: auth0User.email || '',
                auth0Id: auth0User.sub || '',
                isActive: true,
                skillLevel: 0,
                preferSingles: false
              };

              return this.http.post<User>(this.apiUrl, newUser);
            }
            return throwError(() => err);
          }),
          tap(user => this.user = user)
        );
      })
    );
  }

  // Check if user is authenticated
  isAuthenticated(): Observable<boolean> {
    return this.auth0.isAuthenticated$;
  }

  // Get Auth0 access token for API calls
  getAccessToken(): Observable<string> {
    return this.auth0.getAccessTokenSilently();
  }
}
