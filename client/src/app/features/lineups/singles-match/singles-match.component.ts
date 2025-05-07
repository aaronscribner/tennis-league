import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { SinglesMatch } from '../../../core/models/match.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';

// Angular Material imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

// Import the score form component
import { SinglesScoreFormComponent } from '../singles-score-form/singles-score-form.component';

@Component({
  selector: 'app-singles-match',
  templateUrl: './singles-match.component.html',
  styleUrls: ['./singles-match.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule
  ]
})
export class SinglesMatchComponent {
  @Input() match!: SinglesMatch;
  @Input() isCoordinator = false;
  @Output() scoreUpdated = new EventEmitter<SinglesMatch>();

  currentUser: User | null = null;
  
  constructor(
    private authService: AuthService,
    private dialog: MatDialog
  ) {
    this.currentUser = this.authService.currentUser();
  }

  isPlayerInMatch(): boolean {
    if (!this.currentUser || !this.match) return false;

    const playerAId = typeof this.match.playerA === 'string' ? this.match.playerA : this.match.playerA.id;
    const playerBId = typeof this.match.playerB === 'string' ? this.match.playerB : this.match.playerB.id;
    
    return this.currentUser.id === playerAId || this.currentUser.id === playerBId;
  }

  getPlayerName(player: User | string): string {
    if (typeof player === 'string') {
      return 'Player';
    }
    
    return `${player.firstName} ${player.lastName}`;
  }
  
  getPlayerFirstName(player: User | string): string {
    if (typeof player === 'string') {
      return 'Player';
    }
    
    return player.firstName;
  }

  getPlayerSkillLevel(player: User | string): string {
    if (typeof player === 'string') {
      return 'N/A';
    }
    
    return player.skillLevel?.toString() || 'N/A';
  }

  recordScore(): void {
    const dialogRef = this.dialog.open(SinglesScoreFormComponent, {
      width: '500px',
      data: {
        match: this.match,
        playerAName: this.getPlayerName(this.match.playerA),
        playerBName: this.getPlayerName(this.match.playerB)
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.scoreUpdated.emit(result);
      }
    });
  }
}
