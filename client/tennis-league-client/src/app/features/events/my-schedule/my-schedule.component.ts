import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { EventsService } from '../events.service';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';

import { Event } from '../../../core/models/event.model';
import { Rsvp } from '../../../core/models/rsvp.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-my-schedule',
  standalone: true,
  imports: [
    CommonModule, 
    SharedModule, 
    MatCardModule, 
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './my-schedule.component.html',
  styleUrl: './my-schedule.component.scss'
})
export class MyScheduleComponent implements OnInit {
  events: Event[] = [];
  loading = false;
  isAuthenticated$: Observable<boolean>;
  
  constructor(
    public authService: AuthService,
    private eventsService: EventsService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    this.loadMyEvents();
  }

  loadMyEvents(): void {
    this.loading = true;
    
    // First get all upcoming events
    this.eventsService.getUpcomingEvents().pipe(
      // For each event, check if the user has RSVP'd as attending
      switchMap(events => {
        if (events.length === 0) {
          this.loading = false;
          return of([]);
        }
        
        // Create an array of requests to get the user's RSVP for each event
        const rsvpRequests = events.map(event => 
          this.eventsService.getUserRsvp(event._id || '').pipe(
            // If the RSVP exists and isAttending is true, return the event, otherwise return null
            map((rsvp: Rsvp) => rsvp && rsvp.isAttending ? event : null),
            catchError(() => of(null)) // Handle 404 (no RSVP found)
          )
        );
        
        // Combine all RSVP requests
        return forkJoin(rsvpRequests);
      })
    ).subscribe({
      next: (eventResults) => {
        // Filter out null results and store only events user is attending
        this.events = eventResults.filter(event => event !== null) as Event[];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading my events:', error);
        this.snackBar.open('Error loading your scheduled events', 'Close', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  viewEvent(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  viewLineup(eventId: string): void {
    this.router.navigate(['/lineups/event', eventId]);
  }

  login(): void {
    this.authService.login();
  }
}
