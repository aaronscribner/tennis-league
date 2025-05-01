import { Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list.component';
import { authGuard } from '../../core/guards/auth.guard';

export const USERS_ROUTES: Routes = [
  { path: '', component: UserListComponent, canActivate: [authGuard] }
];