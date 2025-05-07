import { Component, OnInit, OnDestroy, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AuthService } from '../../../core/services/auth.service';
import { InvitationCodeService } from '../../../core/services/invitation-code.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss'
})
export class CallbackComponent implements OnInit, OnDestroy {
  loading = true;
  error = false;
  
  private destroyRef = inject(DestroyRef);

  constructor(
    private authService: AuthService,
    private invitationCodeService: InvitationCodeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Monitor auth state
    this.authService.isAuthenticated().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (isAuthenticated) => {
        if (isAuthenticated) {
          // The AuthService will automatically populate the currentUser signal 
          // when authentication happens, but we need to handle navigation
          const userProfile = this.authService.currentUser();
          
          if (userProfile) {
            // User profile is already loaded in the signal
            this.handleAuthenticatedUser(userProfile);
          } else {
            // Wait for user profile to be loaded into the signal
            const userSub = this.authService.user$.subscribe({
              next: (user) => {
                if (user) {
                  this.handleAuthenticatedUser(user);
                } else {
                  console.error('User authenticated but profile not loaded');
                  this.error = true;
                  this.loading = false;
                }
                userSub.unsubscribe();
              },
              error: (err) => {
                console.error('Error loading user profile:', err);
                this.error = true;
                this.loading = false;
              }
            });
          }
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

  private handleAuthenticatedUser(user: any): void {
    // Check if there's an invitation code in session storage
    const invitationCode = sessionStorage.getItem('invitationCode');
    const registrationEmail = sessionStorage.getItem('registrationEmail') || user.email;
    
    // Get the target URL from Auth0 appState (default to /events if not found)
    this.authService.auth0.appState$.subscribe(appState => {
      const targetRoute = appState && appState.target ? appState.target : '/events';
      
      if (invitationCode) {
        // Mark the invitation code as used
        this.invitationCodeService.markCodeAsUsed(invitationCode, user.sub, registrationEmail)
          .pipe(
            finalize(() => {
              // Clear session storage
              sessionStorage.removeItem('invitationCode');
              sessionStorage.removeItem('registrationEmail');
              
              // Navigate to target route (default to events page)
              this.router.navigate([targetRoute]);
            })
          )
          .subscribe({
            next: () => {
              console.log('Invitation code marked as used successfully');
            },
            error: (err) => {
              console.error('Error marking invitation code as used:', err);
              // Continue to target route even if there's an error with the invitation code
            }
          });
      } else {
        // No invitation code, just navigate to target route
        this.router.navigate([targetRoute]);
      }
    });
  }

  ngOnDestroy(): void {
    // Lifecycle method for cleanup
    // The actual cleanup is handled by takeUntilDestroyed with destroyRef
  }
}
