import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DoublesMatch, DoublesTeamCombination } from '../../../core/models/match.model';
import { User } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { DoublesScoreFormComponent } from '../doubles-score-form/doubles-score-form.component';

@Component({
  selector: 'app-doubles-match',
  templateUrl: './doubles-match.component.html',
  styleUrls: ['./doubles-match.component.scss'],
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule]
})
export class DoublesMatchComponent implements OnInit {
  @Input() match!: DoublesMatch;
  @Input() isCoordinator = false;
  @Output() scoreUpdated = new EventEmitter<DoublesMatch>();
  
  currentUser: User | null = null;
  users: { [key: string]: User } = {};
  selectedCombination: DoublesTeamCombination | null = null;
  selectedCombinationIndex: number = 0;
  
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadPlayerDetails();
    
    // Set the first combination as default if available
    if (this.match?.combinations?.length > 0) {
      this.selectedCombination = this.match.combinations[0];
      this.selectedCombinationIndex = 0;
    }
  }
  
  loadCurrentUser(): void {
    this.currentUser = this.authService.currentUser();
  }
  
  loadPlayerDetails(): void {
    // Load details for all players in this match
    if (this.match.players) {
      const playerIds = this.match.players.map(player => 
        typeof player === 'string' ? player : player.id
      );
      
      playerIds.forEach(id => {
        if (typeof id === 'string') {
          this.userService.getUserById(id).subscribe((user: User) => {
            if (user) {
              this.users[id] = user;
            }
          });
        }
      });
    }
  }
  
  getPlayerName(player: User | string): string {
    if (typeof player === 'string') {
      if (this.users[player]) {
        const user = this.users[player];
        return `${user.firstName} ${user.lastName}`;
      }
      return 'Player';
    }
    return `${player.firstName} ${player.lastName}`;
  }
  
  getPlayerSkillLevel(player: User | string): string {
    if (typeof player === 'string') {
      if (this.users[player] && this.users[player].skillLevel) {
        return `Level ${this.users[player].skillLevel}`;
      }
      return 'N/A';
    }
    return player.skillLevel?.toString() || 'N/A';
  }
  
  getTeamNames(players: (User | string)[]): string {
    return players.map(player => this.getPlayerName(player)).join(' / ');
  }
  
  isPlayerInMatch(): boolean {
    if (!this.currentUser || !this.match.players) return false;
    
    const userId = this.currentUser.id;
    return this.match.players.some(player => {
      const playerId = typeof player === 'string' ? player : player.id;
      return playerId === userId;
    });
  }
  
  selectCombination(combination: DoublesTeamCombination, index: number): void {
    this.selectedCombination = combination;
    this.selectedCombinationIndex = index;
  }
  
  getCombinationLabel(index: number): string {
    const combination = this.match.combinations[index];
    return combination.combinationName || `Combination ${index + 1}`;
  }
  
  isWinningCombination(combination: DoublesTeamCombination): boolean {
    if (!this.match.winningCombination || !combination) return false;
    return this.match.winningCombination === (combination as any)._id?.toString();
  }
  
  recordScore(): void {
    if (!this.selectedCombination) return;
    
    const dialogRef = this.dialog.open(DoublesScoreFormComponent, {
      width: '600px',
      data: {
        match: this.match,
        combination: this.selectedCombination,
        combinationIndex: this.selectedCombinationIndex,
        combinationId: (this.selectedCombination as any)._id
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.scoreUpdated.emit(result);
      }
    });
  }
}
