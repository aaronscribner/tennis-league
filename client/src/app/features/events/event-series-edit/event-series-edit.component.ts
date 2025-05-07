import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EventsService } from '../events.service';
import { SharedModule } from '../../../shared/shared.module';
import { Event } from '../../../core/models/event.model';

@Component({
  selector: 'app-event-series-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './event-series-edit.component.html',
  styleUrl: './event-series-edit.component.scss'
})
export class EventSeriesEditComponent implements OnInit {
  seriesId: string | null = null;
  loading = true;
  submitting = false;
  events: Event[] = [];
  seriesForm: FormGroup;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private eventsService: EventsService,
    private snackBar: MatSnackBar
  ) {
    this.seriesForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      maxSinglesPlayers: [0, [Validators.required, Validators.min(2)]],
      maxDoublesPlayers: [0, [Validators.required, Validators.min(4)]],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.seriesId = params.get('seriesId');
      if (this.seriesId) {
        this.loadSeriesEvents();
      } else {
        this.router.navigate(['/events']);
      }
    });
  }

  loadSeriesEvents() {
    if (!this.seriesId) return;
    
    this.loading = true;
    this.eventsService.getEventsBySeries(this.seriesId).subscribe({
      next: (events) => {
        this.events = events;
        if (events.length > 0) {
          this.initFormWithFirstEvent(events[0]);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.snackBar.open('Error loading series events. Please try again.', 'Close', {
          duration: 5000
        });
        this.loading = false;
        this.router.navigate(['/events']);
      }
    });
  }

  initFormWithFirstEvent(event: Event) {
    // Extract time from the date
    const eventDate = new Date(event.date);
    
    // Since there's no endDate property in the Event interface,
    // we'll just use the start date for now and add a default duration
    // Alternative: you could add a duration property to your events or modify the Event interface
    const eventEndDate = new Date(eventDate);
    eventEndDate.setHours(eventDate.getHours() + 2); // Default 2-hour duration
    
    const startTime = this.formatTimeForInput(eventDate);
    const endTime = this.formatTimeForInput(eventEndDate);

    this.seriesForm.patchValue({
      title: event.title,
      maxSinglesPlayers: event.maxSinglesPlayers,
      maxDoublesPlayers: event.maxDoublesPlayers,
      startTime: startTime,
      endTime: endTime
    });
  }

  formatTimeForInput(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onSubmit() {
    if (this.seriesForm.invalid || !this.seriesId) {
      return;
    }
    
    this.submitting = true;
    
    // Prepare data for update
    const updateData = {
      title: this.seriesForm.value.title,
      maxSinglesPlayers: this.seriesForm.value.maxSinglesPlayers,
      maxDoublesPlayers: this.seriesForm.value.maxDoublesPlayers,
      startTime: this.seriesForm.value.startTime,
      endTime: this.seriesForm.value.endTime
    };
    
    this.eventsService.updateEventSeries(this.seriesId, updateData).subscribe({
      next: () => {
        this.snackBar.open('Event series updated successfully', 'Close', {
          duration: 3000
        });
        this.submitting = false;
        this.router.navigate(['/events']);
      },
      error: (error) => {
        console.error('Error updating event series:', error);
        this.snackBar.open('Error updating event series. Please try again.', 'Close', {
          duration: 5000
        });
        this.submitting = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/events']);
  }
}
