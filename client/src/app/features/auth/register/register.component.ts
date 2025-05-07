import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedModule } from '../../../shared/shared.module';
import { InvitationCodeService } from '../../../core/services/invitation-code.service';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, finalize, of, tap } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  codeForm: FormGroup;
  loading = false;
  step = 1; // Step 1: Enter code, Step 2: Auth0 Registration

  constructor(
    private fb: FormBuilder,
    private invitationCodeService: InvitationCodeService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.codeForm = this.fb.group({
      invitationCode: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.email]]
    });
  }

  validateCode(): void {
    if (this.codeForm.invalid) {
      return;
    }

    const code = this.codeForm.get('invitationCode')!.value;
    const email = this.codeForm.get('email')!.value;
    
    this.loading = true;
    this.invitationCodeService.validateCode(code, email)
      .pipe(
        tap(isValid => {
          if (isValid) {
            // Store code in session storage for later use after Auth0 signup
            sessionStorage.setItem('invitationCode', code);
            if (email) {
              sessionStorage.setItem('registrationEmail', email);
            }
            
            // Move to Auth0 registration step
            this.proceedToAuth0Registration();
          } else {
            this.snackBar.open(
              'Invalid invitation code. Please check and try again.',
              'Close',
              { duration: 5000 }
            );
          }
        }),
        catchError(error => {
          console.error('Error validating invitation code:', error);
          this.snackBar.open(
            'Error validating invitation code. Please try again.',
            'Close',
            { duration: 5000 }
          );
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe();
  }

  proceedToAuth0Registration(): void {
    this.step = 2;
    // Redirect to Auth0 sign-up
    this.authService.signUp();
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
