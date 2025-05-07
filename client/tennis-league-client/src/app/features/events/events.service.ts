import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Event } from '../../core/models/event.model';
import { Rsvp } from '../../core/models/rsvp.model';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient) { }

  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl)
      .pipe(
        tap(events => console.log('All events fetched:', events)),
        catchError(this.handleError)
      );
  }

  getUpcomingEvents(): Observable<Event[]> {
    console.log('Calling API endpoint:', `${this.apiUrl}/upcoming`);
    return this.http.get<Event[]>(`${this.apiUrl}/upcoming`)
      .pipe(
        tap(events => console.log('Upcoming events fetched:', events)),
        catchError(this.handleError)
      );
  }

  getEvent(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(event => console.log(`Event fetched with id ${id}:`, event)),
        catchError(this.handleError)
      );
  }

  getEventById(id: string): Observable<Event> {
    return this.getEvent(id);
  }

  createEvent(event: Partial<Event>): Observable<Event> {
    return this.http.post<Event>(this.apiUrl, event)
      .pipe(
        tap(newEvent => console.log('Event created:', newEvent)),
        catchError(this.handleError)
      );
  }

  updateEvent(id: string, event: Partial<Event>): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}`, event)
      .pipe(
        tap(updatedEvent => console.log(`Event updated with id ${id}:`, updatedEvent)),
        catchError(this.handleError)
      );
  }

  updateEventSeries(seriesId: string, eventData: Partial<Event>): Observable<Event[]> {
    return this.http.patch<Event[]>(`${this.apiUrl}/series/${seriesId}/update`, eventData)
      .pipe(
        tap(updatedEvents => console.log(`Event series updated with id ${seriesId}:`, updatedEvents)),
        catchError(this.handleError)
      );
  }

  cancelEvent(id: string): Observable<Event> {
    return this.http.patch<Event>(`${this.apiUrl}/${id}/cancel`, {})
      .pipe(
        tap(cancelledEvent => console.log(`Event cancelled with id ${id}:`, cancelledEvent)),
        catchError(this.handleError)
      );
  }

  cancelEventSeries(seriesId: string): Observable<Event[]> {
    return this.http.patch<Event[]>(`${this.apiUrl}/series/${seriesId}/cancel`, {})
      .pipe(
        tap(cancelledEvents => console.log(`Event series cancelled with id ${seriesId}:`, cancelledEvents)),
        catchError(this.handleError)
      );
  }

  getEventsBySeries(seriesId: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/series/${seriesId}`)
      .pipe(
        tap(events => console.log(`Events fetched for series id ${seriesId}:`, events)),
        catchError(this.handleError)
      );
  }

  deleteEvent(id: string): Observable<Event> {
    return this.http.delete<Event>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => console.log(`Event deleted with id ${id}`)),
        catchError(this.handleError)
      );
  }

  // RSVP operations
  getRsvpsByEvent(eventId: string): Observable<Rsvp[]> {
    return this.http.get<Rsvp[]>(`${this.apiUrl}/${eventId}/rsvps`)
      .pipe(
        tap(rsvps => console.log(`RSVPs fetched for event id ${eventId}:`, rsvps)),
        catchError(this.handleError)
      );
  }

  getUserRsvp(eventId: string): Observable<Rsvp> {
    return this.http.get<Rsvp>(`${this.apiUrl}/${eventId}/rsvp`)
      .pipe(
        tap(rsvp => console.log(`User RSVP fetched for event id ${eventId}:`, rsvp)),
        catchError(this.handleError)
      );
  }

  createRsvp(eventId: string, rsvpData: { 
    isAttending: boolean, 
    preferSingles: boolean,
    notes?: string 
  }): Observable<Rsvp> {
    return this.http.post<Rsvp>(`${this.apiUrl}/${eventId}/rsvp`, rsvpData)
      .pipe(
        tap(newRsvp => console.log(`RSVP created for event id ${eventId}:`, newRsvp)),
        catchError(this.handleError)
      );
  }

  updateRsvp(rsvpId: string, rsvpData: { 
    isAttending?: boolean, 
    preferSingles?: boolean,
    notes?: string 
  }): Observable<Rsvp> {
    return this.http.put<Rsvp>(`${this.apiUrl}/rsvps/${rsvpId}`, rsvpData)
      .pipe(
        tap(updatedRsvp => console.log(`RSVP updated with id ${rsvpId}:`, updatedRsvp)),
        catchError(this.handleError)
      );
  }

  deleteRsvp(rsvpId: string): Observable<Rsvp> {
    return this.http.delete<Rsvp>(`${this.apiUrl}/rsvps/${rsvpId}`)
      .pipe(
        tap(() => console.log(`RSVP deleted with id ${rsvpId}`)),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API error occurred:', error);
    
    let errorMessage = 'An unknown error occurred while communicating with the server';
    
    if (error.status === 0) {
      errorMessage = 'Network error: Unable to connect to the API server. Please check if the server is running.';
      console.error('Network error:', error);
    } else if (error.status === 401) {
      errorMessage = 'Authentication error: Please log in again.';
      console.error('Authentication error:', error);
    } else if (error.status === 403) {
      errorMessage = 'Authorization error: You do not have permission to access this resource.';
      console.error('Authorization error:', error);
    } else if (error.status === 404) {
      errorMessage = 'Resource not found: The requested resource does not exist.';
      console.error('Resource not found:', error);
    } else if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
      console.error('Client error:', error.error.message);
    } else {
      // Server-side error
      errorMessage = `Server error: ${error.status} - ${error.error?.message || error.statusText}`;
      console.error('Server error:', error);
    }
    
    return throwError(() => new Error(errorMessage));
  }
}