import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user$: Observable<User | null> = new Observable<User | null>();
  isCoordinator$: Observable<boolean> = new Observable<boolean>();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Use getUser() to ensure proper typing
    this.user$ = this.authService.getUser();
    this.isCoordinator$ = this.authService.isCoordinator();
  }

  logout(): void {
    this.authService.logout();
  }
}
