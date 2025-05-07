import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { InvitationCodesComponent } from './invitation-codes/invitation-codes.component';
import { authGuard } from '../../core/guards/auth.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../core/models/user.model';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.COORDINATOR] }
  },
  {
    path: 'invitation-codes',
    component: InvitationCodesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.COORDINATOR] }
  }
];