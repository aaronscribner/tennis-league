import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { LineupService } from '../../../core/services/lineup.service';
import { EventsService } from '../../events/events.service';
import { AuthService } from '../../../core/services/auth.service';

import { Event } from '../../../core/models/event.model';
import { Lineup, Match, SinglesMatch, DoublesMatch } from '../../../core/models/match.model';
import { User, UserRole } from '../../../core/models/user.model';

// Angular Material imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

// Import our components for singles and doubles matches
import { SinglesMatchComponent } from '../singles-match/singles-match.component';
import { DoublesMatchComponent } from '../doubles-match/doubles-match.component';

@Component({
  selector: 'app-lineup-view',
  templateUrl: './lineup-view.component.html',
  styleUrls: ['./lineup-view.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule,
    MatTabsModule,
    MatCardModule,
    MatDividerModule,
    SinglesMatchComponent,
    DoublesMatchComponent
  ]
})
export class LineupViewComponent implements OnInit {
  event$!: Observable<Event>;
  currentUser: User | null = null;
  eventId!: string;
  isCoordinator = false;
  
  loadingLineup = true;
  loadingEvent = true;
  lineup: Lineup | null = null;
  event: Event | null = null;
  singlesMatches: SinglesMatch[] = [];
  doublesMatches: DoublesMatch[] = [];
  
  // For backwards compatibility
  legacyMatches: Match[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lineupService: LineupService,
    private eventsService: EventsService,
    private authService: AuthService
  ) {
    // Set up an effect to react to changes in the currentUser signal
    effect(() => {
      this.currentUser = this.authService.currentUser();
      this.isCoordinator = this.currentUser?.role === UserRole.COORDINATOR || 
                           this.currentUser?.roles?.includes('coordinator') || 
                           false;
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.eventId = params.get('id') || '';
      this.loadEventData();
      this.loadLineupData();
    });
  }

  loadEventData(): void {
    this.loadingEvent = true;
    this.event$ = this.eventsService.getEvent(this.eventId);
    this.event$.subscribe(event => {
      this.event = event;
      this.loadingEvent = false;
    });
  }
  
  loadLineupData(): void {
    this.loadingLineup = true;
    
    // Try to get lineup with singles and doubles matches
    this.lineupService.getEventLineup(this.eventId).subscribe({
      next: (lineup) => {
        this.lineup = lineup;
        this.singlesMatches = lineup.singlesMatches || [];
        this.doublesMatches = lineup.doublesMatches || [];
        this.loadingLineup = false;
      },
      error: (error) => {
        console.error('Error loading lineup:', error);
        
        // Fallback to legacy method
        this.lineupService.getMatches(this.eventId).subscribe(matches => {
          this.legacyMatches = matches;
          this.loadingLineup = false;
        });
      }
    });
  }

  isCurrentUserInSinglesMatch(match: SinglesMatch): boolean {
    if (!this.currentUser) return false;
    
    const userIsPlayerA = 
      typeof match.playerA === 'string' 
        ? match.playerA === this.currentUser.id 
        : match.playerA.id === this.currentUser.id;
    
    const userIsPlayerB = 
      typeof match.playerB === 'string' 
        ? match.playerB === this.currentUser.id 
        : match.playerB.id === this.currentUser.id;
    
    return userIsPlayerA || userIsPlayerB;
  }
  
  isCurrentUserInDoublesMatch(match: DoublesMatch): boolean {
    if (!this.currentUser) return false;
    
    return match.players.some(player => 
      typeof player === 'string' 
        ? player === this.currentUser?.id 
        : player.id === this.currentUser?.id
    );
  }
  
  // Legacy method for backward compatibility
  isCurrentUserInMatch(match: Match): boolean {
    if (!this.currentUser) return false;
    
    const userInTeamA = match.teamA?.players?.some((player: User | string) => 
      typeof player === 'string' ? player === this.currentUser?.id : player.id === this.currentUser?.id
    );
    
    const userInTeamB = match.teamB?.players?.some((player: User | string) => 
      typeof player === 'string' ? player === this.currentUser?.id : player.id === this.currentUser?.id
    );
    
    return Boolean(userInTeamA || userInTeamB);
  }

  onSinglesScoreUpdated(match: SinglesMatch): void {
    // Find and replace the updated match in the list
    const index = this.singlesMatches.findIndex(m => m._id === match._id);
    if (index !== -1) {
      this.singlesMatches[index] = match;
    }
  }
  
  onDoublesScoreUpdated(match: DoublesMatch): void {
    // Find and replace the updated match in the list
    const index = this.doublesMatches.findIndex(m => m._id === match._id);
    if (index !== -1) {
      this.doublesMatches[index] = match;
    }
  }

  backToEvent(): void {
    this.router.navigate(['/events', this.eventId]);
  }

  regenerateLineup(): void {
    this.loadingLineup = true;
    this.lineupService.generateLineup(this.eventId).subscribe(lineup => {
      this.lineup = lineup;
      this.singlesMatches = lineup.singlesMatches || [];
      this.doublesMatches = lineup.doublesMatches || [];
      this.loadingLineup = false;
    });
  }

  getUserFullName(player: any): string {
    if (!player || typeof player === 'string') {
      return 'Player';
    }
    return `${player.firstName} ${player.lastName}`;
  }

  getPlayerSkillLevel(player: any): string {
    if (!player || typeof player === 'string') {
      return 'N/A';
    }
    return player.skillLevel?.toString() || 'N/A';
  }

  // Helper method to safely handle arrays of players that could be either strings or User objects
  getPlayersArray(players: any[] | undefined): any[] {
    if (!players) {
      return [];
    }
    return players;
  }
}
