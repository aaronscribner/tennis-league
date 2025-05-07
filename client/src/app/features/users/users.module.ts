import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { USERS_ROUTES } from './users.routes';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserListComponent } from './user-list/user-list.component';
import { UserDetailsComponent } from './user-details/user-details.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(USERS_ROUTES),
    // Include standalone components
    UserProfileComponent,
    UserListComponent
  ]
})
export class UsersModule { }
