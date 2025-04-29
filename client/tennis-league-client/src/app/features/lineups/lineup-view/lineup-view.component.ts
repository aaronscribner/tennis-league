import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, switchMap, map } from 'rxjs';

import { LineupService } from '../../../core/services/lineup.service';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatchCardComponent } from '../match-card/match-card.component';

import { Event } from '../../../core/models/event.model';
import { Match } from '../../../core/models/match.model';
import { User } from '../../../core/models/user.model';

// Angular Material imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-lineup-view',
  templateUrl: './lineup-view.component.html',
  styleUrls: ['./lineup-view.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    MatchCardComponent, 
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule
  ]
})
export class LineupViewComponent implements OnInit {
  event$!: Observable<Event>;
  matches$!: Observable<Match[]>;
  currentUser: User | null = null;
  eventId!: string;
  isAdmin = false;
  
  // Add missing properties from the template
  loadingLineup = true;
  loadingEvent = true;
  lineup: any = null;
  event: Event | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lineupService: LineupService,
    private eventService: EventService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.roles?.includes('admin') || false;
    });

    this.route.paramMap.pipe(
      switchMap(params => {
        this.eventId = params.get('id') || '';
        this.loadEventData();
        return this.lineupService.getMatches(this.eventId);
      })
    ).subscribe(matches => {
      if (matches && matches.length > 0) {
        this.lineup = {
          matches: matches
        };
      }
      this.loadingLineup = false;
    });
  }

  loadEventData(): void {
    this.loadingEvent = true;
    this.event$ = this.eventService.getEvent(this.eventId);
    this.event$.subscribe(event => {
      this.event = event;
      this.loadingEvent = false;
    });
  }

  isCurrentUserInMatch(match: Match): boolean {
    if (!this.currentUser) return false;
    
    const userInTeamA = match.teamA.players.some(player => 
      typeof player === 'string' ? player === this.currentUser?.id : player.id === this.currentUser?.id
    );
    
    const userInTeamB = match.teamB.players.some(player => 
      typeof player === 'string' ? player === this.currentUser?.id : player.id === this.currentUser?.id
    );
    
    return userInTeamA || userInTeamB;
  }

  recordScore(match: Match): void {
    this.router.navigate(['lineups', this.eventId, 'score', match.id]);
  }

  backToEvent(): void {
    this.router.navigate(['/events', this.eventId]);
  }

  regenerateLineup(): void {
    this.loadingLineup = true;
    this.lineupService.generateLineup(this.eventId).subscribe(lineup => {
      this.lineup = lineup;
      this.loadingLineup = false;
    });
  }

  getUserFullName(player: any): string {
    if (typeof player === 'string') {
      return 'Player';
    }
    return `${player.firstName} ${player.lastName}`;
  }

  getPlayerSkillLevel(player: any): string {
    if (typeof player === 'string') {
      return 'N/A';
    }
    return player.skillLevel?.toString() || 'N/A';
  }
}
