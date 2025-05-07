import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models/user.model';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SharedModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  // Keep user$ for backwards compatibility with the template
  user$: Observable<User | null>;
  
  // Use a computed signal for the coordinator check
  isCoordinator = computed(() => 
    this.authService.currentUser()?.roles?.find(x => x === UserRole.COORDINATOR) !== undefined
  );

  constructor(public authService: AuthService) {
    // Initialize the observable for backward compatibility
    this.user$ = this.authService.getUser();
  }

  ngOnInit(): void {
    // No need to subscribe or fetch data, the signal is already initialized in the auth service
  }

  logout(): void {
    this.authService.logout();
  }
}
