import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Components
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';

// Routes
import { ADMIN_ROUTES } from './admin.routes';

@NgModule({
  declarations: [
    // Empty because we're using standalone components
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(ADMIN_ROUTES),
    ReactiveFormsModule,
    // Material
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    // Components
    AdminDashboardComponent
  ]
})
export class AdminModule { }