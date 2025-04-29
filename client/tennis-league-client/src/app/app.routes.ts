import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { map } from 'rxjs/operators';

// Auth guard function
const isAuthenticated = () => {
  const authService = inject(AuthService);
  return authService.isAuthenticated().pipe(
    map(isAuth => isAuth ? true : { path: '/login' })
  );
};

// Admin guard function
const isAdmin = () => {
  const authService = inject(AuthService);
  return authService.getUser().pipe(
    map(user => user?.role === 'admin' ? true : { path: '/events' })
  );
};

export const routes: Routes = [
  { path: '', redirectTo: '/events', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'callback', loadComponent: () => import('./features/auth/callback/callback.component').then(m => m.CallbackComponent) },
  { 
    path: 'profile', 
    loadComponent: () => import('./features/auth/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [isAuthenticated]
  },
  { 
    path: 'events', 
    children: [
      { path: '', loadComponent: () => import('./features/events/event-list/event-list.component').then(m => m.EventListComponent) },
      { path: 'calendar', loadComponent: () => import('./features/events/calendar/calendar.component').then(m => m.CalendarComponent) },
      { path: 'new', loadComponent: () => import('./features/events/event-form/event-form.component').then(m => m.EventFormComponent), canActivate: [isAuthenticated, isAdmin] },
      { path: ':id', loadComponent: () => import('./features/events/event-details/event-details.component').then(m => m.EventDetailsComponent) },
      { path: ':id/edit', loadComponent: () => import('./features/events/event-form/event-form.component').then(m => m.EventFormComponent), canActivate: [isAuthenticated, isAdmin] },
    ]
  },
  { 
    path: 'users', 
    canActivate: [isAuthenticated, isAdmin],
    children: [
      { path: '', loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent) },
      { path: ':id', loadComponent: () => import('./features/users/user-details/user-details.component').then(m => m.UserDetailsComponent) },
      { path: ':id/edit', loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent) },
    ]
  },
  { 
    path: 'lineups', 
    canActivate: [isAuthenticated],
    children: [
      { path: 'event/:eventId', loadComponent: () => import('./features/lineups/lineup-view/lineup-view.component').then(m => m.LineupViewComponent) },
      { path: 'match/:matchId/score', loadComponent: () => import('./features/lineups/score-form/score-form.component').then(m => m.ScoreFormComponent) },
    ]
  },
  // Fallback route
  { path: '**', redirectTo: '/events' }
];
