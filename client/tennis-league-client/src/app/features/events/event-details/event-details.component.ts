import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { LineupService } from '../../../core/services/lineup.service';

import { Event } from '../../../core/models/event.model';
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
  currentUser: User | null = null;
  isAdmin = false;
  eventId: string | null = null;
  attendeesList: User[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private eventService: EventService,
    private authService: AuthService,
    private lineupService: LineupService,
    private snackBar: MatSnackBar
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated();
    this.rsvpForm = this.fb.group({
      isAttending: [true, Validators.required],
      preferSingles: [false],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(params => {
        this.eventId = params.get('id');
        this.loading = true;
      }),
      switchMap(params => this.eventService.getEvent(params.get('id') || ''))
    ).subscribe({
      next: (event) => {
        this.event = event;
        this.loading = false;
        this.loadCurrentUser();
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

  loadCurrentUser(): void {
    this.authService.getUser().subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === UserRole.ADMIN;
      
      // Update RSVP form with user's preference
      if (user) {
        this.rsvpForm.patchValue({
          preferSingles: user.preferSingles
        });
      }
    });
  }

  loadRsvp(): void {
    if (!this.eventId) return;
    
    this.loadingRsvp = true;
    this.eventService.getUserRsvp(this.eventId).subscribe({
      next: (rsvp) => {
        this.rsvp = rsvp;
        if (rsvp) {
          this.rsvpForm.patchValue({
            isAttending: rsvp.isAttending,
            preferSingles: rsvp.preferSingles,
            notes: rsvp.notes
          });
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
    this.lineupService.getEventLineup(this.eventId).subscribe({
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
    if (!this.eventId || !this.currentUser || this.rsvpForm.invalid) return;
    
    this.submittingRsvp = true;
    const rsvpData = this.rsvpForm.value;
    
    if (this.rsvp && this.rsvp._id) {
      // Update existing RSVP
      this.eventService.updateRsvp(this.rsvp._id, rsvpData).subscribe({
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
      this.eventService.createRsvp(this.eventId, rsvpData).subscribe({
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
    this.lineupService.createLineup(this.eventId).subscribe({
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
    this.lineupService.republishLineup(this.lineup._id).subscribe({
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

  cancelEvent(): void {
    if (!this.eventId) return;
    
    if (confirm('Are you sure you want to cancel this event? This cannot be undone.')) {
      this.eventService.cancelEvent(this.eventId).subscribe({
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

  isEventFull(): boolean {
    if (!this.event) return false;
    return this.event.attendees ? this.event.attendees.length >= this.event.maxPlayers : false;
  }
}
