import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// This guard uses Auth0 with your custom AuthService
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.isAuthenticated().pipe(
    tap(isAuthenticated => {
      if (!isAuthenticated) {
        router.navigate(['/login']);
      }
    })
  );
};

// Coordinator role guard
export const coordinatorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.isCoordinator().pipe(
    tap(isCoordinator => {
      if (!isCoordinator) {
        router.navigate(['/events']);
      }
    })
  );
};

// Keep adminGuard for backward compatibility, but now it uses coordinatorGuard
export const adminGuard: CanActivateFn = coordinatorGuard;