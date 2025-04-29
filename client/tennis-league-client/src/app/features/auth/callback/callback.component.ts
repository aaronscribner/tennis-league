import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss']
})
export class CallbackComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Auth0 will handle the token exchange automatically
    // We just need to wait for the authentication to complete
    this.authService.isAuthenticated().subscribe(isAuthenticated => {
      if (isAuthenticated) {
        // If user is authenticated, fetch their data and redirect to events
        this.authService.getUser().subscribe(user => {
          this.router.navigate(['/events']);
        });
      }
    });
  }
}
