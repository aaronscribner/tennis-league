import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Lineup, Match } from '../../core/models/match.model';

@Injectable({
  providedIn: 'root'
})
export class LineupsService {
  private apiUrl = `${environment.apiUrl}/lineups`;

  constructor(private http: HttpClient) { }

  getEventLineup(eventId: string): Observable<Lineup> {
    return this.http.get<Lineup>(`${this.apiUrl}/event/${eventId}`);
  }

  getMatches(eventId: string): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.apiUrl}/event/${eventId}/matches`);
  }

  getMatch(matchId: string): Observable<Match> {
    return this.http.get<Match>(`${this.apiUrl}/match/${matchId}`);
  }

  getMatchById(matchId: string): Observable<Match> {
    return this.getMatch(matchId);
  }

  createLineup(eventId: string): Observable<Lineup> {
    return this.http.post<Lineup>(`${this.apiUrl}/event/${eventId}`, {});
  }

  generateLineup(eventId: string): Observable<Lineup> {
    return this.http.post<Lineup>(`${this.apiUrl}/event/${eventId}/generate`, {});
  }

  updateLineup(lineupId: string, matchUpdates: any[]): Observable<Lineup> {
    return this.http.put<Lineup>(`${this.apiUrl}/${lineupId}`, matchUpdates);
  }

  republishLineup(lineupId: string): Observable<Lineup> {
    return this.http.post<Lineup>(`${this.apiUrl}/${lineupId}/republish`, {});
  }

  updateMatchScore(
    matchId: string, 
    teamAScore: number, 
    teamBScore: number = 0,
    notes?: string  
  ): Observable<Match> {
    return this.http.put<Match>(`${this.apiUrl}/match/${matchId}/score`, {
      teamAScore,
      teamBScore,
      notes
    });
  }
}