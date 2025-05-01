import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { EventService } from '../../../core/services/event.service';
import { Event, EventType } from '../../../core/models/event.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, SharedModule, ReactiveFormsModule],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.scss'
})
export class EventFormComponent implements OnInit {
  eventForm: FormGroup;
  isEditMode = false;
  eventId: string | null = null;
  loading = false;
  eventTypes = Object.values(EventType);
  
  // For time selection
  timeSlots: string[] = [];
  
  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.eventForm = this.createForm();
    this.generateTimeSlots();
  }

  ngOnInit(): void {
    // Check if we're editing an existing event
    this.eventId = this.route.snapshot.paramMap.get('id');
    
    if (this.eventId) {
      this.isEditMode = true;
      this.loading = true;
      
      this.eventService.getEventById(this.eventId).subscribe({
        next: (event) => {
          this.populateForm(event);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading event:', error);
          this.snackBar.open('Error loading event details', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      location: ['', [Validators.required, Validators.maxLength(200)]],
      date: [new Date(), [Validators.required]],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      repeatWeekly: [false],
      description: [''],
      maxPlayers: [12, [Validators.required, Validators.min(2), Validators.max(24)]],
      eventType: [EventType.SINGLES, [Validators.required]],
    });
  }

  private generateTimeSlots(): void {
    // Generate time slots in 15-minute intervals
    for (let hour = 6; hour < 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        const amPm = hour < 12 ? 'AM' : 'PM';
        this.timeSlots.push(`${formattedHour}:${minute.toString().padStart(2, '0')} ${amPm}`);
      }
    }
  }

  private populateForm(event: Event): void {
    const date = new Date(event.date);
    
    // Extract time components
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
    const amPm = hours < 12 ? 'AM' : 'PM';
    const startTime = `${formattedHour}:${minutes.toString().padStart(2, '0')} ${amPm}`;
    
    // Calculate end time (assuming 2 hours for now, can be adjusted based on actual data model)
    const endDate = new Date(date);
    endDate.setHours(date.getHours() + 2);
    const endHours = endDate.getHours();
    const endMinutes = endDate.getMinutes();
    const formattedEndHour = endHours % 12 === 0 ? 12 : endHours % 12;
    const endAmPm = endHours < 12 ? 'AM' : 'PM';
    const endTime = `${formattedEndHour}:${endMinutes.toString().padStart(2, '0')} ${endAmPm}`;
    
    this.eventForm.patchValue({
      title: event.title,
      location: event.location,
      date: date,
      startTime: startTime,
      endTime: endTime,
      description: event.description || '',
      maxPlayers: event.maxPlayers,
      eventType: event.eventType,
      repeatWeekly: false // Since this is not in the current model, defaulting to false
    });
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.markFormGroupTouched(this.eventForm);
      return;
    }

    this.loading = true;
    const formValue = this.eventForm.value;
    
    // Convert date and time to a Date object
    const date = new Date(formValue.date);
    const [startTimeStr, startAmPm] = formValue.startTime.split(' ');
    const [startHours, startMinutes] = startTimeStr.split(':').map(Number);
    
    // Convert to 24-hour format
    let hours24 = startHours;
    if (startAmPm === 'PM' && startHours !== 12) {
      hours24 += 12;
    } else if (startAmPm === 'AM' && startHours === 12) {
      hours24 = 0;
    }
    
    date.setHours(hours24, startMinutes);
    
    const eventData: Partial<Event> = {
      title: formValue.title,
      location: formValue.location,
      date: date,
      description: formValue.description,
      maxPlayers: formValue.maxPlayers,
      eventType: formValue.eventType,
      isCancelled: false
    };

    if (this.isEditMode && this.eventId) {
      this.eventService.updateEvent(this.eventId, eventData).subscribe({
        next: () => {
          this.snackBar.open('Event updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/events']);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error updating event:', error);
          this.snackBar.open('Error updating event', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    } else {
      this.eventService.createEvent(eventData).subscribe({
        next: () => {
          this.snackBar.open('Event created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/events']);
          this.loading = false;
          
          // If repeatWeekly is true, create additional events
          if (formValue.repeatWeekly) {
            for (let i = 1; i <= 8; i++) {
              const repeatDate = new Date(date);
              repeatDate.setDate(date.getDate() + (i * 7));
              
              const repeatEventData = {
                ...eventData,
                date: repeatDate
              };
              
              this.eventService.createEvent(repeatEventData).subscribe();
            }
          }
        },
        error: (error) => {
          console.error('Error creating event:', error);
          this.snackBar.open('Error creating event', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as FormGroup).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
}
