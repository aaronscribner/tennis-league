import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Lineup, Match } from '../models/match.model';

@Injectable({
  providedIn: 'root'
})
export class LineupService {
  private apiUrl = `${environment.apiUrl}/lineups`;

  constructor(private http: HttpClient) { }

  getEventLineup(eventId: string): Observable<Lineup> {
    return this.http.get<Lineup>(`${this.apiUrl}/event/${eventId}`);
  }

  // Add missing method that's being called by LineupViewComponent
  getMatches(eventId: string): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.apiUrl}/event/${eventId}/matches`);
  }

  // Add alias for getMatch that's being used in components
  getMatchById(matchId: string): Observable<Match> {
    return this.getMatch(matchId);
  }

  createLineup(eventId: string): Observable<Lineup> {
    return this.http.post<Lineup>(`${this.apiUrl}/event/${eventId}`, {});
  }

  // Add generateLineup method that's used in LineupViewComponent
  generateLineup(eventId: string): Observable<Lineup> {
    return this.http.post<Lineup>(`${this.apiUrl}/event/${eventId}/generate`, {});
  }

  updateLineup(lineupId: string, matchUpdates: any[]): Observable<Lineup> {
    return this.http.put<Lineup>(`${this.apiUrl}/${lineupId}`, matchUpdates);
  }

  republishLineup(lineupId: string): Observable<Lineup> {
    return this.http.post<Lineup>(`${this.apiUrl}/${lineupId}/republish`, {});
  }

  getMatch(matchId: string): Observable<Match> {
    return this.http.get<Match>(`${this.apiUrl}/match/${matchId}`);
  }

  updateMatchScore(
    matchId: string, 
    teamAScore: number, 
    teamBScore: number = 0  // Default value to make parameter optional
  ): Observable<Match> {
    return this.http.put<Match>(`${this.apiUrl}/match/${matchId}/score`, {
      teamAScore,
      teamBScore
    });
  }
}
