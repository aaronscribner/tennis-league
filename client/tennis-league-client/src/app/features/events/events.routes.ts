import { Routes } from '@angular/router';
import { EventListComponent } from './event-list/event-list.component';
import { EventDetailsComponent } from './event-details/event-details.component';
import { EventFormComponent } from './event-form/event-form.component';
import { CalendarComponent } from './calendar/calendar.component';
import { authGuard, coordinatorGuard } from '../../core/guards/auth.guard';

export const EVENTS_ROUTES: Routes = [
  { path: '', component: EventListComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'new', component: EventFormComponent, canActivate: [authGuard, coordinatorGuard] },
  { path: ':id', component: EventDetailsComponent },
  { path: ':id/edit', component: EventFormComponent, canActivate: [authGuard, coordinatorGuard] }
];