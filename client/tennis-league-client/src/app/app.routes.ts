import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { CallbackComponent } from './features/auth/callback/callback.component';

export const routes: Routes = [
  { path: '', redirectTo: '/events', pathMatch: 'full' },
  // Add direct route for callback to handle Auth0 redirects
  { path: 'callback', component: CallbackComponent },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'events',
    loadChildren: () => import('./features/events/events.routes').then(m => m.EVENTS_ROUTES)
  },
  {
    path: 'lineups',
    loadChildren: () => import('./features/lineups/lineups.routes').then(m => m.LINEUPS_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES),
    canActivate: [authGuard]
  }
];
