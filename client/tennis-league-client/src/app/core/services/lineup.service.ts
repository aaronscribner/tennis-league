import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Lineup, Match, SinglesMatch, DoublesMatch, Set, SinglesSet } from '../models/match.model';

@Injectable({
  providedIn: 'root'
})
export class LineupService {
  private apiUrl = `${environment.apiUrl}/lineups`;

  constructor(private http: HttpClient) { }

  getEventLineup(eventId: string): Observable<Lineup> {
    return this.http.get<Lineup>(`${this.apiUrl}/event/${eventId}`);
  }

  getSinglesMatches(eventId: string): Observable<SinglesMatch[]> {
    return this.http.get<SinglesMatch[]>(`${this.apiUrl}/event/${eventId}/singles`);
  }
  
  getDoublesMatches(eventId: string): Observable<DoublesMatch[]> {
    return this.http.get<DoublesMatch[]>(`${this.apiUrl}/event/${eventId}/doubles`);
  }

  // Get all matches (both singles and doubles) for backward compatibility
  getMatches(eventId: string): Observable<Match[]> {
    return this.http.get<Match[]>(`${this.apiUrl}/event/${eventId}/matches`);
  }

  getSinglesMatch(matchId: string): Observable<SinglesMatch> {
    return this.http.get<SinglesMatch>(`${this.apiUrl}/match/singles/${matchId}`);
  }
  
  getDoublesMatch(matchId: string): Observable<DoublesMatch> {
    return this.http.get<DoublesMatch>(`${this.apiUrl}/match/doubles/${matchId}`);
  }

  // Get match of any type for backward compatibility
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

  getMatch(matchId: string): Observable<Match> {
    return this.http.get<Match>(`${this.apiUrl}/match/${matchId}`);
  }

  updateSinglesMatchScore(
    matchId: string, 
    sets: SinglesSet[]
  ): Observable<SinglesMatch> {
    return this.http.put<SinglesMatch>(`${this.apiUrl}/match/singles/${matchId}/score`, { sets });
  }
  
  updateDoublesMatchScore(
    matchId: string,
    combinationId: string,
    sets: Set[]
  ): Observable<DoublesMatch> {
    return this.http.put<DoublesMatch>(
      `${this.apiUrl}/match/doubles/${matchId}/combination/${combinationId}/score`, 
      { sets }
    );
  }

  // Keep old method for backward compatibility
  updateMatchScore(
    matchId: string, 
    teamAScore: number, 
    teamBScore: number = 0
  ): Observable<Match> {
    return this.http.put<Match>(`${this.apiUrl}/match/${matchId}/score`, {
      teamAScore,
      teamBScore
    });
  }
}
