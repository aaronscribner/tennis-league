import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LineupsService } from '../lineups.service';
import { AuthService } from '../../../core/services/auth.service';
import { Match } from '../../../core/models/match.model';
import { User, UserRole } from '../../../core/models/user.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-score-form',
  standalone: true,
  imports: [CommonModule, SharedModule, ReactiveFormsModule],
  templateUrl: './score-form.component.html',
  styleUrls: ['./score-form.component.scss']
})
export class ScoreFormComponent implements OnInit {
  matchId: string | null = null;
  match: Match | null = null;
  currentUser: User | null = null;
  isCoordinator = false;
  loading = true;
  submitting = false;
  scoreForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private lineupsService: LineupsService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.scoreForm = this.createScoreForm();
    
    // Set up an effect to react to changes in the currentUser signal
    effect(() => {
      this.currentUser = this.authService.currentUser();
      this.isCoordinator = this.currentUser?.role === UserRole.COORDINATOR;
    });
  }

  ngOnInit(): void {
    this.matchId = this.route.snapshot.paramMap.get('matchId');
    
    if (!this.matchId) {
      this.snackBar.open('Match ID is required', 'Close', { duration: 3000 });
      this.router.navigate(['/events']);
      return;
    }
    
    // Load match data
    this.loadMatch();
  }

  private createScoreForm(): FormGroup {
    return this.fb.group({
      teamAScore: [0, [Validators.required, Validators.min(0)]],
      teamBScore: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  loadMatch(): void {
    if (!this.matchId) return;
    
    this.loading = true;
    this.lineupsService.getMatchById(this.matchId).subscribe({
      next: (match) => {
        this.match = match;
        this.populateForm();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading match:', error);
        this.snackBar.open('Could not load match details', 'Close', { duration: 5000 });
        this.loading = false;
        this.navigateBack();
      }
    });
  }

  populateForm(): void {
    if (!this.match) return;

    // If match already has a score, pre-fill the form
    if (this.match.isCompleted) {
      this.scoreForm.patchValue({
        teamAScore: this.match.teamA?.score || 0,
        teamBScore: this.match.teamB?.score || 0,
        notes: this.match.notes || ''
      });
    }
  }

  submitScore(): void {
    if (this.scoreForm.invalid || !this.match) return;

    this.submitting = true;
    const formData = this.scoreForm.value;

    this.lineupsService.updateMatchScore(
      this.matchId!, 
      formData.teamAScore, 
      formData.teamBScore,
      formData.notes
    )
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: (updatedMatch) => {
          this.snackBar.open('Score submitted successfully', 'Close', { duration: 3000 });
          // Add the eventId to the match if not present
          if (!this.match!.eventId && typeof this.match!.event === 'string') {
            this.match!.eventId = this.match!.event;
          }
          // Navigate back to event lineup
          this.navigateBack();
        },
        error: (error) => {
          console.error('Error updating score:', error);
          this.snackBar.open('Error submitting score', 'Close', { duration: 5000 });
        }
      });
  }

  navigateBack(): void {
    if (this.match?.eventId) {
      this.router.navigate(['/lineups/event', this.match.eventId]);
    } else if (typeof this.match?.event === 'string') {
      this.router.navigate(['/lineups/event', this.match.event]);
    } else {
      this.router.navigate(['/events']);
    }
  }

  getTeamPlayers(team: 'A' | 'B'): string {
    if (!this.match) return '';
    
    const players = team === 'A' ? this.match.teamA?.players : this.match.teamB?.players;
    if (!players || players.length === 0) return 'No players assigned';
    
    return players.map((player: User | string) => {
      if (typeof player === 'string') return 'Unknown Player';
      return `${player.firstName} ${player.lastName}`;
    }).join(', ');
  }

  canSubmitScore(): boolean {
    if (!this.currentUser || !this.match) return false;
    
    // Admins can always submit scores
    if (this.isCoordinator) return true;
    
    // Check if current user is part of the match
    return this.isUserInMatch();
  }

  isUserInMatch(): boolean {
    if (!this.currentUser || !this.match) return false;
    
    const userId = this.currentUser._id || this.currentUser.id;
    
    // Check team A
    const inTeamA = this.match.teamA?.players.some((player: User | string) => {
      return typeof player === 'string' ? player === userId : (player._id || player.id) === userId;
    });
    
    // Check team B
    const inTeamB = this.match.teamB?.players.some((player: User | string) => {
      return typeof player === 'string' ? player === userId : (player._id || player.id) === userId;
    });
    
    return !!inTeamA || !!inTeamB;
  }
}
