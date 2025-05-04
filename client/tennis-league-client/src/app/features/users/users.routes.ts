import { Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserListComponent } from './user-list/user-list.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { authGuard } from '../../core/guards/auth.guard';

export const USERS_ROUTES: Routes = [
  { 
    path: 'profile', 
    component: UserProfileComponent,
    canActivate: [authGuard]
  },
  { 
    path: '', 
    component: UserListComponent 
  },
  { 
    path: ':id', 
    component: UserDetailsComponent 
  }
];