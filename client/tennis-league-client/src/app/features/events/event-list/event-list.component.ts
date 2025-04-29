import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { Event } from '../../../core/models/event.model';
import { SharedModule } from '../../../shared/shared.module';
import { User, UserRole } from '../../../core/models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit {
  events: Event[] = [];
  loading = false;
  isAuthenticated$: Observable<boolean>;
  currentUser: User | null = null;
  isAdmin = false;

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    this.loadEvents();
    this.loadCurrentUser();
  }

  loadEvents(): void {
    this.loading = true;
    this.eventService.getUpcomingEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.snackBar.open('Error loading events. Please try again later.', 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }

  loadCurrentUser(): void {
    this.authService.getUser().subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === UserRole.ADMIN;
    });
  }

  viewEvent(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  createEvent(): void {
    this.router.navigate(['/events/new']);
  }

  calculateRemainingSpots(event: Event): number {
    const attendeesCount = event.attendees ? event.attendees.length : 0;
    return Math.max(0, event.maxPlayers - attendeesCount);
  }
}
