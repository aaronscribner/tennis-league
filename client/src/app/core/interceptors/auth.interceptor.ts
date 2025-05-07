import { HttpInterceptorFn, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { Observable, from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept requests to our API
  if (!req.url.includes(environment.apiUrl)) {
    return next(req);
  }
  
  const authService = inject(AuthService);
  
  // Get the access token and add it to the request
  return from(authService.getAccessToken()).pipe(
    switchMap(token => {
      // Clone the request and add the authorization header
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Send the newly created request with the token
      return next(authReq);
    })
  );
};
