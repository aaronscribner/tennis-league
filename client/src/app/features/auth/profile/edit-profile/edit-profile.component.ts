import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../core/models/user.model';
import { finalize, take } from 'rxjs/operators';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatSliderModule
  ],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss'
})
export class EditProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  user: User | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^\+?[0-9\s\-()]+$/)]],
      city: [''],
      nickname: [''],
      displayOnlyNickname: [false],
      skillLevel: [1.00, [Validators.required, Validators.min(1.00), Validators.max(5.00)]],
      preferSingles: [false],
      preferDoubles: [false]
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.authService.getUser()
      .pipe(
        take(1),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (user) => {
          if (user) {
            this.user = user;
            this.profileForm.patchValue({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phoneNumber: user.phoneNumber || '',
              city: user.city || '',
              nickname: user.nickname || '',
              displayOnlyNickname: user.displayOnlyNickname || false,
              skillLevel: user.skillLevel || 1.00,
              preferSingles: user.preferSingles || false,
              preferDoubles: user.preferDoubles || false
            });
          }
        },
        error: (err) => {
          this.snackBar.open('Error loading profile data', 'Close', { duration: 5000 });
          console.error('Error loading profile data:', err);
        }
      });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.loading = true;
      // Format skill level to have 2 decimal places
      const formValues = this.profileForm.value;
      formValues.skillLevel = parseFloat(formValues.skillLevel.toFixed(2));

      const updatedUser = {
        ...formValues
      };
      
      this.userService.updateProfile(updatedUser)
        .pipe(
          finalize(() => this.loading = false)
        )
        .subscribe({
          next: (response) => {
            // Update the user in the auth service to reflect changes immediately
            this.authService.updateCurrentUser(response);
            this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
            this.router.navigate(['/users/profile']);
          },
          error: (err) => {
            this.snackBar.open('Error updating profile', 'Close', { duration: 5000 });
            console.error('Error updating profile:', err);
          }
        });
    }
  }

  cancel(): void {
    this.router.navigate(['/users/profile']);
  }
}
