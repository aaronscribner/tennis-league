import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const requiredRoles = route.data?.['roles'] as string[];
  
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  
  return authService.getUser().pipe(
    map(user => {
      if (!user) {
        router.navigate(['/login']);
        return false;
      }
      
      // Check if user has any of the required roles
      const hasRole = requiredRoles.some(role => 
        user.role === role || (user.roles && user.roles.includes(role))
      );
      
      if (!hasRole) {
        router.navigate(['/events']);
        return false;
      }
      
      return true;
    })
  );
};