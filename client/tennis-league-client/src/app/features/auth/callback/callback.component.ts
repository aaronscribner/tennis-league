import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss'
})
export class CallbackComponent implements OnInit {
  loading = true;
  error = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Monitor auth state
    this.authService.isAuthenticated().subscribe({
      next: (isAuthenticated) => {
        if (isAuthenticated) {
          // Get user profile before navigating
          this.authService.getUser().subscribe({
            next: (user) => {
              if (user) {
                this.router.navigate(['/events']);
              } else {
                console.error('User authenticated but profile not loaded');
                this.error = true;
                this.loading = false;
              }
            },
            error: (err) => {
              console.error('Error loading user profile:', err);
              this.error = true;
              this.loading = false;
            }
          });
        } else {
          // Add a delay to give Auth0 time to process the callback
          setTimeout(() => {
            // If still not authenticated after delay, show error
            this.authService.isAuthenticated().subscribe(isAuth => {
              if (!isAuth) {
                this.error = true;
                this.loading = false;
              }
            });
          }, 2000);
        }
      },
      error: (err) => {
        console.error('Authentication error:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
}
