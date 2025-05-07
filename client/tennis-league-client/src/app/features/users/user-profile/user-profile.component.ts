import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EventsService } from '../../events/events.service';
import { Router } from '@angular/router';
import { User, UserRole } from '../../../core/models/user.model';
import { Event } from '../../../core/models/event.model';
import { Rsvp } from '../../../core/models/rsvp.model';
import { switchMap, forkJoin, of, catchError, map } from 'rxjs';

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})
export class UserProfileComponent implements OnInit {
  loading = true;
  userProfile: User | null = null;
  upcomingEvents: Event[] = []; // Always initialized as an empty array
  playerStats: PlayerStats = {
    totalMatches: 0,
    wins: 0,
    losses: 0
  };

  // Use computed signal for coordinator check
  isCoordinator = computed(() => 
    this.authService.currentUser()?.role === UserRole.COORDINATOR ||
    this.authService.currentUser()?.roles?.includes(UserRole.COORDINATOR) ||
    false
  );

  constructor(
    public authService: AuthService,
    private eventsService: EventsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    // Check if we already have the user in the signal
    const currentUser = this.authService.currentUser();
    
    if (currentUser) {
      this.userProfile = currentUser;
      this.loading = false;
      this.loadUpcomingEvents();
      // In a real app, we would also fetch the player stats
      this.loadPlayerStats();
    } else {
      // If no user in the signal, try to fetch it
      this.authService.getUser().subscribe({
        next: (user) => {
          this.userProfile = user;
          this.loading = false;
          this.loadUpcomingEvents();
          this.loadPlayerStats();
        },
        error: (error) => {
          console.error('Error loading user profile:', error);
          this.loading = false;
        }
      });
    }
  }

  loadUpcomingEvents(): void {
    // Get all upcoming events
    this.eventsService.getUpcomingEvents().pipe(
      // For each event, check if the user has RSVP'd as attending
      switchMap(events => {
        if (events.length === 0) {
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
        this.upcomingEvents = eventResults.filter(event => event !== null) as Event[];
      },
      error: (error) => {
        console.error('Error loading upcoming events:', error);
        this.upcomingEvents = [];
      }
    });
  }

  loadPlayerStats(): void {
    // This is where you would fetch real player stats from an API
    // For now, we'll just use dummy data
    setTimeout(() => {
      this.playerStats = {
        totalMatches: 15,
        wins: 10,
        losses: 5
      };
    }, 500);
  }

  getWinPercentage(): number {
    if (this.playerStats.totalMatches === 0) return 0;
    return Math.round((this.playerStats.wins / this.playerStats.totalMatches) * 100);
  }

  editProfile(): void {
    // Navigate to the profile edit page
    this.router.navigate(['/users/profile/edit']);
  }

  logout(): void {
    this.authService.logout();
  }
}
