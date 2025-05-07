import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { EventsService } from '../events.service';
import { AuthService } from '../../../core/services/auth.service';
import { LineupsService } from '../../lineups/lineups.service';

import { Event, RecurrenceType } from '../../../core/models/event.model';
import { User, UserRole } from '../../../core/models/user.model';
import { Rsvp } from '../../../core/models/rsvp.model';
import { Lineup } from '../../../core/models/match.model';

import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.scss']
})
export class EventDetailsComponent implements OnInit {
  event: Event | null = null;
  rsvp: Rsvp | null = null;
  lineup: Lineup | null = null;
  rsvpForm: FormGroup;
  loading = true;
  loadingRsvp = false;
  loadingLineup = false;
  submittingRsvp = false;
  generatingLineup = false;
  isAuthenticated$: Observable<boolean>;
  eventId: string | null = null;
  attendeesList: User[] = [];
  
  // Use computed signal for coordinator check
  isCoordinator = computed(() => 
    this.authService.currentUser()?.role === UserRole.COORDINATOR
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private eventsService: EventsService,
    public authService: AuthService,
    private lineupsService: LineupsService,
    private snackBar: MatSnackBar
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated();
    this.rsvpForm = this.fb.group({
      rsvpStatus: ['notGoing', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(params => {
        this.eventId = params.get('id');
        this.loading = true;
      }),
      switchMap(params => this.eventsService.getEvent(params.get('id') || ''))
    ).subscribe({
      next: (event) => {
        this.event = event;
        this.loading = false;
        this.loadRsvp();
        this.loadLineup();
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.snackBar.open('Error loading event. Please try again.', 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
  }

  loadRsvp(): void {
    if (!this.eventId) return;
    
    this.loadingRsvp = true;
    this.eventsService.getUserRsvp(this.eventId).subscribe({
      next: (rsvp) => {
        this.rsvp = rsvp;
        if (rsvp) {
          // Map existing RSVP data to new format
          let rsvpStatus = 'notGoing';
          if (rsvp.isAttending) {
            if (rsvp.preferSingles === true) {
              rsvpStatus = 'preferSingles';
            } else if (rsvp.preferSingles === false) {
              rsvpStatus = 'preferDoubles';
            }
          }
          this.rsvpForm.patchValue({ rsvpStatus });
        }
        this.loadingRsvp = false;
      },
      error: (error) => {
        // 404 is expected if the user hasn't RSVP'd yet
        if (error.status !== 404) {
          console.error('Error loading RSVP:', error);
        }
        this.loadingRsvp = false;
      }
    });
  }

  loadLineup(): void {
    if (!this.eventId) return;
    
    this.loadingLineup = true;
    this.lineupsService.getEventLineup(this.eventId).subscribe({
      next: (lineup) => {
        if (lineup && lineup._id) {
          this.lineup = lineup;
        }
        this.loadingLineup = false;
      },
      error: (error) => {
        // 404 is expected if no lineup exists yet
        if (error.status !== 404) {
          console.error('Error loading lineup:', error);
        }
        this.loadingLineup = false;
      }
    });
  }

  submitRsvp(): void {
    if (!this.eventId || !this.authService.currentUser() || this.rsvpForm.invalid) return;
    
    this.submittingRsvp = true;
    const rsvpStatus = this.rsvpForm.value.rsvpStatus;
    
    // Convert new format to the format expected by the API
    const rsvpData = {
      isAttending: rsvpStatus !== 'notGoing',
      preferSingles: rsvpStatus === 'singles' || rsvpStatus === 'preferSingles',
      playingSinglesOnly: rsvpStatus === 'singles',
      playingDoublesOnly: rsvpStatus === 'doubles'
    };
    
    if (this.rsvp && this.rsvp._id) {
      // Update existing RSVP
      this.eventsService.updateRsvp(this.rsvp._id, rsvpData).subscribe({
        next: (updatedRsvp) => {
          this.rsvp = updatedRsvp;
          this.snackBar.open('Your RSVP has been updated', 'Close', {
            duration: 3000
          });
          this.submittingRsvp = false;
        },
        error: (error) => {
          console.error('Error updating RSVP:', error);
          this.snackBar.open('Error updating your RSVP. Please try again.', 'Close', {
            duration: 5000
          });
          this.submittingRsvp = false;
        }
      });
    } else {
      // Create new RSVP
      this.eventsService.createRsvp(this.eventId, rsvpData).subscribe({
        next: (newRsvp) => {
          this.rsvp = newRsvp;
          this.snackBar.open('Your RSVP has been submitted', 'Close', {
            duration: 3000
          });
          this.submittingRsvp = false;
        },
        error: (error) => {
          console.error('Error creating RSVP:', error);
          this.snackBar.open('Error submitting your RSVP. Please try again.', 'Close', {
            duration: 5000
          });
          this.submittingRsvp = false;
        }
      });
    }
  }

  generateLineup(): void {
    if (!this.eventId) return;
    
    this.generatingLineup = true;
    this.lineupsService.createLineup(this.eventId).subscribe({
      next: (lineup) => {
        this.lineup = lineup;
        this.snackBar.open('Match lineup generated successfully', 'Close', {
          duration: 3000
        });
        this.generatingLineup = false;
      },
      error: (error) => {
        console.error('Error generating lineup:', error);
        this.snackBar.open('Error generating lineup. Please try again.', 'Close', {
          duration: 5000
        });
        this.generatingLineup = false;
      }
    });
  }

  regenerateLineup(): void {
    if (!this.lineup || !this.lineup._id) return;
    
    this.generatingLineup = true;
    this.lineupsService.republishLineup(this.lineup._id).subscribe({
      next: (lineup) => {
        this.lineup = lineup;
        this.snackBar.open('Match lineup regenerated successfully', 'Close', {
          duration: 3000
        });
        this.generatingLineup = false;
      },
      error: (error) => {
        console.error('Error regenerating lineup:', error);
        this.snackBar.open('Error regenerating lineup. Please try again.', 'Close', {
          duration: 5000
        });
        this.generatingLineup = false;
      }
    });
  }

  viewLineup(): void {
    this.router.navigate(['/lineups/event', this.eventId]);
  }

  editEvent(): void {
    this.router.navigate(['/events', this.eventId, 'edit']);
  }
  
  editEventSeries(): void {
    if (!this.event?.seriesId) return;
    
    this.router.navigate(['/events', 'series', this.event.seriesId, 'edit']);
  }

  cancelEvent(): void {
    if (!this.eventId) return;
    
    if (confirm('Are you sure you want to cancel this event? This cannot be undone.')) {
      this.eventsService.cancelEvent(this.eventId).subscribe({
        next: () => {
          this.snackBar.open('Event cancelled successfully', 'Close', {
            duration: 3000
          });
          this.router.navigate(['/events']);
        },
        error: (error) => {
          console.error('Error cancelling event:', error);
          this.snackBar.open('Error cancelling event. Please try again.', 'Close', {
            duration: 5000
          });
        }
      });
    }
  }

  cancelEventSeries(): void {
    if (!this.event?.seriesId) return;
    
    if (confirm('Are you sure you want to cancel ALL events in this series? This cannot be undone.')) {
      this.eventsService.cancelEventSeries(this.event.seriesId).subscribe({
        next: () => {
          this.snackBar.open('Event series cancelled successfully', 'Close', {
            duration: 3000
          });
          this.router.navigate(['/events']);
        },
        error: (error) => {
          console.error('Error cancelling event series:', error);
          this.snackBar.open('Error cancelling event series. Please try again.', 'Close', {
            duration: 5000
          });
        }
      });
    }
  }

  isPartOfSeries(): boolean {
    console.log("isPartOfSeries", this.event?.seriesId);
    return this.event?.seriesId ? true : false;
  }

  isEventFull(): boolean {
    if (!this.event) {
      return false;
    }
    
    const attendeesCount = this.event.attendees ? this.event.attendees.length : 0;
    
    // If either singles or doubles still has spots, the event is not full
    if (this.event.isSinglesAllowed && attendeesCount < this.event.maxSinglesPlayers) {
      return false;
    }

    return this.event.isDoublesAllowed && attendeesCount < this.event.maxDoublesPlayers;
  }
  
  calculateRemainingSpots(): { singles: number, doubles: number, totalAttendees: number } {
    if (!this.event) {
      return { singles: 0, doubles: 0, totalAttendees: 0 };
    }
    
    const attendeesCount = this.event.attendees ? this.event.attendees.length : 0;
    
    // Default to 0 if properties don't exist
    const maxSinglesPlayers = this.event.maxSinglesPlayers || 0;
    const maxDoublesPlayers = this.event.maxDoublesPlayers || 0;
    
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