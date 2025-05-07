import { Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { EditProfileComponent } from '../auth/profile/edit-profile/edit-profile.component';
import { authGuard } from '../../core/guards/auth.guard';

export const USERS_ROUTES: Routes = [
  { 
    path: 'profile', 
    component: UserProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile/edit',
    component: EditProfileComponent,
    canActivate: [authGuard]
  },
  { 
    path: ':id', 
    component: UserDetailsComponent 
  }
];