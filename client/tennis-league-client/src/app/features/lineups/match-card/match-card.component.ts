import { Component, Input, Output, EventEmitter, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { Match } from '../../../core/models/match.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-match-card',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './match-card.component.html',
  styleUrls: ['./match-card.component.scss']
})
export class MatchCardComponent implements OnInit {
  @Input() match!: Match;
  @Input() compact = false;
  @Input() canRecordScore = false;
  @Output() onRecordScore = new EventEmitter<Match>();
  
  currentUser: User | null = null;
  isUserMatch = false;
  
  // Add arrays to safely iterate in template
  teamAPlayersList: Array<string | User> = [];
  teamBPlayersList: Array<string | User> = [];

  constructor(private authService: AuthService) {
    // Set up an effect to react to changes in the currentUser signal
    effect(() => {
      this.currentUser = this.authService.currentUser();
      this.checkIfUserMatch();
    });
  }

  ngOnInit(): void {
    // Ensure match has necessary properties for the template
    if (this.match && !this.match.hasOwnProperty('startTime')) {
      this.match.startTime = undefined;
    }
    
    if (this.match && !this.match.hasOwnProperty('court')) {
      this.match.court = undefined;
    }
    
    // Setup safe arrays for template iteration
    if (this.match?.teamA?.players) {
      this.teamAPlayersList = [...this.match.teamA.players];
    }
    
    if (this.match?.teamB?.players) {
      this.teamBPlayersList = [...this.match.teamB.players];
    }
  }

  checkIfUserMatch(): void {
    if (!this.currentUser || !this.match) {
      this.isUserMatch = false;
      return;
    }

    const userId = this.currentUser._id;
    
    // Check if user is in team A
    const inTeamA = this.match.teamA.players.some(player => {
      return typeof player === 'string' ? player === userId : player._id === userId;
    });
    
    // Check if user is in team B
    const inTeamB = this.match.teamB.players.some(player => {
      return typeof player === 'string' ? player === userId : player._id === userId;
    });
    
    this.isUserMatch = inTeamA || inTeamB;
  }

  getPlayerName(player: User | string): string {
    if (typeof player === 'string') {
      return 'Unassigned Player';
    }
    return `${player.firstName} ${player.lastName}`;
  }

  getPlayerLevel(player: User | string): string {
    if (typeof player === 'string') {
      return 'N/A';
    }
    return player.skillLevel?.toString() || 'N/A';
  }

  getTeamPlayerNames(team: 'A' | 'B'): string {
    const players = team === 'A' ? this.match.teamA.players : this.match.teamB.players;
    
    if (!players || players.length === 0) {
      return 'TBD';
    }
    
    return players.map(player => {
      if (typeof player === 'string') {
        return 'Unassigned';
      }
      return `${player.firstName} ${player.lastName.charAt(0)}.`;
    }).join(', ');
  }

  isWinner(team: 'A' | 'B'): boolean {
    if (!this.match.isCompleted) {
      return false;
    }
    
    if (team === 'A') {
      return (this.match.teamA.score || 0) > (this.match.teamB.score || 0);
    } else {
      return (this.match.teamB.score || 0) > (this.match.teamA.score || 0);
    }
  }
}
