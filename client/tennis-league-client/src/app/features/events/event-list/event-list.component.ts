import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subscription, filter, take } from 'rxjs';
import { EventsService } from '../events.service';
import { AuthService } from '../../../core/services/auth.service';
import { Event } from '../../../core/models/event.model';
import { SharedModule } from '../../../shared/shared.module';
import { User, UserRole } from '../../../core/models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit, OnDestroy {
  events: Event[] = [];
  loading = false;
  isAuthenticated$: Observable<boolean>;
  currentUser: User | null = null;
  isCoordinator = false;
  private subscriptions = new Subscription();

  constructor(
    private eventsService: EventsService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated();
    
    // Set up an effect to react to changes in the currentUser signal
    effect(() => {
      const user = this.authService.currentUser();
      console.log('User data received from signal:', user);
      console.log('User role:', user?.role);
      console.log('User roles array:', user?.roles);
      console.log('Is COORDINATOR role?', user?.roles?.find(x => x === UserRole.COORDINATOR));
      console.log('UserRole enum values:', UserRole);
      
      this.currentUser = user;
      this.isCoordinator = user?.roles?.find(x => x === UserRole.COORDINATOR) !== undefined;
      
      console.log('isCoordinator flag set to:', this.isCoordinator);
    });
  }

  ngOnInit(): void {
    console.log('EventListComponent initialized');
    this.loadEvents();
    
    // Ensure user profile is properly loaded
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions when component is destroyed
    this.subscriptions.unsubscribe();
  }
  
  loadUserProfile(): void {
    // First check if we already have the user in the signal
    if (this.authService.currentUser()) {
      console.log("User already loaded in signal:", this.authService.currentUser());
      return;
    }
    
    // Check authentication state and explicitly load user if needed
    const authSub = this.authService.isAuthenticated().pipe(
      filter(isAuthenticated => isAuthenticated),
      take(1)
    ).subscribe(() => {
      // Force the user$ observable to emit an update
      const userSub = this.authService.getUser().pipe(take(1)).subscribe({
        next: (user) => {
          if (user) {
            console.log('Explicitly loaded user:', user);
            // User is now loaded into the signal via the auth service tap operator
          } else {
            console.error('Failed to load user profile');
          }
        },
        error: (err) => {
          console.error('Error loading user profile:', err);
        }
      });
      this.subscriptions.add(userSub);
    });
    
    this.subscriptions.add(authSub);
  }

  loadEvents(): void {
    this.loading = true;
    console.log('Fetching upcoming events from API...');
    this.eventsService.getUpcomingEvents().subscribe({
      next: (events) => {
        console.log('Events received from API:', events);
        console.log('Number of events:', events.length);
        this.events = events;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        // Check for specific error types
        if (error.status === 401) {
          console.error('Authentication error - check if tokens are being sent properly');
        } else if (error.status === 403) {
          console.error('Authorization error - check user permissions');
        } else if (error.status === 0) {
          console.error('Network error - API might be unavailable');
        }
        this.snackBar.open('Error loading events. Please try again later.', 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }

  viewEvent(eventId: string): void {
    this.router.navigate(['/events', eventId]);
  }

  createEvent(): void {
    this.router.navigate(['/events/new']);
  }

  calculateRemainingSpots(event: Event): { singles: number, doubles: number, totalAttendees: number } {
    const attendeesCount = event.attendees ? event.attendees.length : 0;
    
    // Default to 0 if properties don't exist
    const maxSinglesPlayers = event.maxSinglesPlayers || 0;
    const maxDoublesPlayers = event.maxDoublesPlayers || 0;
    
    // Calculate remaining spots for singles and doubles
    const remainingSinglesSpots = Math.max(0, maxSinglesPlayers - attendeesCount);
    const remainingDoublesSpots = Math.max(0, maxDoublesPlayers - attendeesCount);
    
    return {
      singles: remainingSinglesSpots,
      doubles: remainingDoublesSpots,
      totalAttendees: attendeesCount
    };
  }
}
