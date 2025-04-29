import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthModule } from '@auth0/auth0-angular';
import { environment } from '../../environments/environment';

// Services
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { EventService } from './services/event.service';
import { LineupService } from './services/lineup.service';

// Create an HTTP Interceptor to add the Auth token to API requests
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, from, lastValueFrom } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // If the request is to our API, add the auth token
    if (req.url.includes(environment.apiUrl)) {
      return from(lastValueFrom(this.authService.getAccessToken())).pipe(
        mergeMap(token => {
          const authReq = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          });
          return next.handle(authReq);
        })
      );
    }
    
    // For other requests, just pass them through
    return next.handle(req);
  }
}

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    AuthModule.forRoot({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        redirect_uri: environment.auth0.authorizationParams.redirect_uri,
        audience: environment.auth0.authorizationParams.audience,
        scope: environment.auth0.authorizationParams.scope
      }
    }),
  ],
  providers: [
    AuthService,
    UserService,
    EventService,
    LineupService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthHttpInterceptor,
      multi: true
    }
  ]
})
export class CoreModule { }
