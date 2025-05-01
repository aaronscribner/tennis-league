import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    return this.http.get<Event[]>(this.apiUrl);
  }

  getUpcomingEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/upcoming`);
  }

  getEvent(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`);
  }

  getEventById(id: string): Observable<Event> {
    return this.getEvent(id);
  }

  createEvent(event: Partial<Event>): Observable<Event> {
    return this.http.post<Event>(this.apiUrl, event);
  }

  updateEvent(id: string, event: Partial<Event>): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}`, event);
  }

  cancelEvent(id: string): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${id}/cancel`, {});
  }

  deleteEvent(id: string): Observable<Event> {
    return this.http.delete<Event>(`${this.apiUrl}/${id}`);
  }

  // RSVP operations
  getRsvpsByEvent(eventId: string): Observable<Rsvp[]> {
    return this.http.get<Rsvp[]>(`${this.apiUrl}/${eventId}/rsvps`);
  }

  getUserRsvp(eventId: string): Observable<Rsvp> {
    return this.http.get<Rsvp>(`${this.apiUrl}/${eventId}/rsvp`);
  }

  createRsvp(eventId: string, rsvpData: { 
    isAttending: boolean, 
    preferSingles: boolean,
    notes?: string 
  }): Observable<Rsvp> {
    return this.http.post<Rsvp>(`${this.apiUrl}/${eventId}/rsvp`, rsvpData);
  }

  updateRsvp(rsvpId: string, rsvpData: { 
    isAttending?: boolean, 
    preferSingles?: boolean,
    notes?: string 
  }): Observable<Rsvp> {
    return this.http.put<Rsvp>(`${this.apiUrl}/rsvps/${rsvpId}`, rsvpData);
  }

  deleteRsvp(rsvpId: string): Observable<Rsvp> {
    return this.http.delete<Rsvp>(`${this.apiUrl}/rsvps/${rsvpId}`);
  }
}