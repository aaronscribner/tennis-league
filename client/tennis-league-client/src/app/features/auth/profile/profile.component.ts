import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { SharedModule } from '../../../shared/shared.module';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  user: User | null = null;
  loading = true;
  saving = false;
  skillLevels = [
    { value: 1, label: 'Beginner (1.0-2.0)' },
    { value: 2, label: 'Beginner-Intermediate (2.5-3.0)' },
    { value: 3, label: 'Intermediate (3.5-4.0)' },
    { value: 4, label: 'Advanced (4.5-5.0)' },
    { value: 5, label: 'Elite (5.5+)' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: [{ value: '', disabled: true }],
      skillLevel: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      preferSingles: [false]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.authService.getUser().subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
          this.profileForm.patchValue({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            skillLevel: user.skillLevel || 1,
            preferSingles: user.preferSingles || false
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user profile', error);
        this.snackBar.open('Error loading profile. Please try again later.', 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.saving = true;
    const updatedProfile = {
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      skillLevel: this.profileForm.value.skillLevel,
      preferSingles: this.profileForm.value.preferSingles
    };

    if (this.user && this.user._id) {
      this.userService.updateUser(this.user._id, updatedProfile).subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.snackBar.open('Profile updated successfully!', 'Close', {
            duration: 3000
          });
          this.saving = false;
        },
        error: (error) => {
          console.error('Error updating profile', error);
          this.snackBar.open('Error updating profile. Please try again.', 'Close', {
            duration: 5000
          });
          this.saving = false;
        }
      });
    }
  }
}
